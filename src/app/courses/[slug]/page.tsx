import { getCourseBySlug, getAllCourseSlugs } from "@/lib/courses";
import CoursePageClient from "./CoursePageClient";
import { getCurrentUser } from "@/services/user";
import { redirect } from 'next/navigation';
import { Types } from 'mongoose';
import { ICourse } from '@/models/Course';
import { connect } from '@/lib/mongodb';
import CourseModel from "@/models/Course";
import ModuleModel from "@/models/Module";
import LessonModel from "@/models/Lesson";

// Function to generate static paths at build time
export async function generateStaticParams() {
  const slugs = await getAllCourseSlugs();
  return slugs;
}

// The main page component is now async to fetch data
export default async function CoursePage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // Ensure DB connection
  await connect();

  // Find the course by slug and explicitly lean + include the instructor field
  const courseDoc = await CourseModel.findOne({ slug })
    .select('-__v') // Exclude version field
    .lean();
  
  if (!courseDoc) {
    redirect('/not-found');
  }

  // Fetch modules for the course, sorted by order
  const modules = await ModuleModel.find({ course: courseDoc._id })
    .sort({ order: 1 })
    .lean();

  // For each module, fetch its lessons sorted by order
  const modulesWithLessons = await Promise.all(
    modules.map(async (mod) => {
      const lessons = await LessonModel.find({ module: mod._id })
        .sort({ order: 1 })
        .lean();
      return {
        ...mod,
        _id: mod._id.toString(),
        lessons: lessons.map(lesson => ({
          ...lesson,
          _id: lesson._id.toString(),
          module: lesson.module?.toString?.() || lesson.module,
        })),
        course: mod.course?.toString?.() || mod.course,
      };
    })
  );

  // Prepare the course object for the client
  const course = {
    ...courseDoc,
    _id: courseDoc._id.toString(),
    authors: courseDoc.authors?.map((author: any) =>
      typeof author === 'object' && author._id
        ? { ...author, _id: author._id.toString() }
        : author.toString()
    ),
    modules: modulesWithLessons,
    createdAt: courseDoc.createdAt ? new Date(courseDoc.createdAt).toISOString() : undefined,
    updatedAt: courseDoc.updatedAt ? new Date(courseDoc.updatedAt).toISOString() : undefined,
  };

  // Fetch current user
  const user = await getCurrentUser();

  // Check if user is logged in and enrolled using the serialized course._id
  if (user && course && user.enrolledCourses?.some((enrolledCourseId: Types.ObjectId | string) =>
    enrolledCourseId.toString() === course._id
  )) {
    // User is enrolled, find the first module and first lesson
    if (course.modules && course.modules.length > 0) {
      const firstModule = course.modules[0];
      if (firstModule.lessons && firstModule.lessons.length > 0) {
        const firstLesson = firstModule.lessons[0];
        const firstLessonId = typeof firstLesson === 'string'
          ? firstLesson
          : (firstLesson?._id || null);

        if (firstLessonId) {
          redirect(`/learn/${slug}/${firstLessonId}`);
        }
      }
    }
    redirect('/dashboard?message=Course has no lessons yet');
  }

  // Include a console log to debug what data is being passed to the client component
  console.log('Course data being passed to client:', 
    JSON.stringify({
      ...course,
      description: course.description.substring(0, 50) + '...' // Truncate for readability
    }, null, 2)
  );

  return <CoursePageClient course={course} />;
}