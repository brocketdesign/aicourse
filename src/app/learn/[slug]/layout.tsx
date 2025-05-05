import { ReactNode } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { connect } from '@/lib/mongodb';
import Course, { ICourse } from '@/models/Course'; // Import ICourse
import User, { IUser } from '@/models/User'; // Import IUser
import Module, { IModule } from '@/models/Module'; // Import IModule
import Lesson, { ILesson } from '@/models/Lesson'; // Import ILesson
import CourseSidebar from '@/components/learn/CourseSidebar';
import { Types } from 'mongoose';

// Define interfaces for lean objects
interface LeanLesson {
  _id: Types.ObjectId | string;
  title: string;
  // Add other necessary fields if needed
}

interface LeanModule {
  _id: Types.ObjectId | string;
  title: string;
  lessons: LeanLesson[];
  order?: number;
  // Add other necessary fields if needed
}

interface LeanCourse {
  _id: Types.ObjectId | string;
  title: string;
  slug: string;
  modules: LeanModule[];
  // Add other necessary fields if needed
}

interface LeanUser {
  _id: Types.ObjectId | string;
  clerkId: string;
  enrolledCourses: (Types.ObjectId | string)[];
  progress: { [courseId: string]: (Types.ObjectId | string)[] };
  // Add other necessary fields if needed
}

// Helper function to safely get completed lesson IDs
function getCompletedLessonIds(user: LeanUser | null, courseId: string): string[] {
  // Check if user, progress, and the specific course progress exist
  if (!user || !user.progress || !user.progress[courseId]) {
    return [];
  }
  const progress = user.progress[courseId];
  // Ensure the progress is an array and map to strings
  return Array.isArray(progress) ? progress.map((id: Types.ObjectId | string) => id.toString()) : [];
}

export default async function LearnLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { slug: string }; // Fix: params is not a Promise
}) {
  const { slug } = params; // Use params directly
  const { userId } = await auth();

  if (!userId) {
    return redirect(`/sign-in?redirect_url=/courses/${slug}`);
  }

  await connect();

  // Fetch course
  const course = await Course.findOne({ slug }).lean<LeanCourse>();

  if (!course) {
    return redirect('/dashboard');
  }

  // Fetch modules for the course, sorted by order
  const modules = await Module.find({ course: course._id })
    .sort({ order: 1 })
    .lean();

  // For each module, fetch its lessons
  const modulesWithLessons = await Promise.all(
    modules.map(async (mod) => {
      const lessons = await Lesson.find({ module: mod._id })
        .sort({ order: 1 })
        .select('_id title') // Only fetch needed fields
        .lean();
      
      return {
        ...mod,
        _id: mod._id.toString(),
        lessons: lessons.map(lesson => ({
          ...lesson,
          _id: lesson._id.toString(),
        })),
      };
    })
  );

  // Create the serialized course with modules and lessons
  const serializedCourse = {
    ...course,
    _id: course._id.toString(),
    modules: modulesWithLessons,
    createdAt: course.createdAt ? course.createdAt.toISOString() : undefined,
    updatedAt: course.updatedAt ? course.updatedAt.toISOString() : undefined,
  };

  // Fetch user data including enrolled courses and progress
  const user = await User.findOne({ clerkId: userId })
                         .select('enrolledCourses progress')
                         .lean<LeanUser>();

  if (!user) {
    return redirect('/sign-in');
  }

  const courseIdStr = serializedCourse._id.toString();

  // Check if the user is enrolled in this specific course
  const isEnrolled = user.enrolledCourses.some(
    (enrolledCourseId) => enrolledCourseId.toString() === courseIdStr
  );

  if (!isEnrolled) {
    console.log(`User ${userId} not enrolled in course ${slug}. Redirecting.`);
    return redirect(`/courses/${slug}?error=not_enrolled`);
  }

  const completedLessonIds = getCompletedLessonIds(user, courseIdStr);

  // Add debug log to see what's being sent to the sidebar
  console.log('Course data for sidebar:', {
    courseId: courseIdStr,
    moduleCount: serializedCourse.modules.length,
    totalLessons: serializedCourse.modules.reduce((sum, mod) => sum + mod.lessons.length, 0)
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <CourseSidebar
        course={serializedCourse}
        completedLessonIds={completedLessonIds}
        isEnrolled={isEnrolled}
      />
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
