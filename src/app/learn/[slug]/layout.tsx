import { ReactNode } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { connect } from '@/lib/mongodb';
import Course, { ICourse } from '@/models/Course';
import User, { IUser } from '@/models/User';
import Module, { IModule } from '@/models/Module';
import Lesson, { ILesson } from '@/models/Lesson';
import CourseSidebar from '@/components/learn/CourseSidebar';
import { Types } from 'mongoose';

// Helper function to safely get completed lesson IDs from the full User document
function getCompletedLessonIds(user: IUser | null, courseId: string): string[] {
  if (!user || !user.progress || !Array.isArray(user.progress)) {
    console.log('[LearnLayout] getCompletedLessonIds: User or user.progress is invalid.');
    return [];
  }
  try {
    const courseObjectId = new Types.ObjectId(courseId);
    const courseProgress = user.progress.find(
      (p: { courseId: Types.ObjectId; completedLessons: Types.ObjectId[] | string[] }) => p.courseId.equals(courseObjectId)
    );

    if (!courseProgress || !Array.isArray(courseProgress.completedLessons)) {
      console.log(`[LearnLayout] getCompletedLessonIds: No progress found for course ${courseId} or completedLessons is invalid.`);
      return [];
    }

    const completedIds = courseProgress.completedLessons.map((id: Types.ObjectId | string) => id.toString());
    console.log(`[LearnLayout] getCompletedLessonIds: Found ${completedIds.length} completed lessons for course ${courseId}.`);
    return completedIds;
  } catch (error) {
    console.error(`[LearnLayout] getCompletedLessonIds: Error processing courseId ${courseId}:`, error);
    return [];
  }
}

export default async function LearnLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { slug: string };
}) {
  const { slug } = params;
  const authResult = await auth();
  const userId = authResult?.userId;

  if (!userId) {
    return redirect(`/sign-in?redirect_url=/courses/${slug}`);
  }

  await connect();
  console.log(`[LearnLayout] DB connected. Fetching data for slug: ${slug}, userId: ${userId}`);

  const course = await Course.findOne({ slug }).lean<ICourse>();

  if (!course || !course._id || typeof course._id === 'string') {
    console.log(`[LearnLayout] Course not found, missing _id, or _id is not an ObjectId for slug: ${slug}. Redirecting.`);
    return redirect('/dashboard');
  }
  const courseIdStr = (course._id as Types.ObjectId).toString();
  console.log(`[LearnLayout] Found course: ${course.title} (${courseIdStr})`);

  const modules = await Module.find({ course: course._id })
    .sort({ order: 1 })
    .lean<IModule[]>();

  const modulesWithLessons = await Promise.all(
    modules.map(async (mod) => {
      const moduleId = mod._id ? (mod._id as Types.ObjectId).toString() : undefined;
      if (!moduleId) {
        console.warn('[LearnLayout] Module missing _id:', mod);
        return { ...mod, _id: '', lessons: [] };
      }

      const lessons = await Lesson.find({ module: mod._id })
        .sort({ order: 1 })
        .select('_id title')
        .lean<ILesson[]>();

      return {
        ...mod,
        _id: moduleId,
        lessons: lessons.map(lesson => {
          const lessonId = lesson._id ? (lesson._id as Types.ObjectId).toString() : '';
          if (!lessonId) {
            console.warn('[LearnLayout] Lesson missing _id:', lesson);
          }
          return {
            ...lesson,
            _id: lessonId,
          };
        }),
      };
    })
  );
  console.log(`[LearnLayout] Fetched ${modulesWithLessons.length} modules with lessons.`);

  const serializedCourse = {
    ...course,
    _id: courseIdStr,
    modules: modulesWithLessons,
  };

  console.log(`[LearnLayout] Fetching full user document for clerkId: ${userId}`);
  const user = await User.findOne({ clerkId: userId })
                         .select('enrolledCourses progress') as IUser | null;

  if (!user) {
    console.log(`[LearnLayout] User not found for clerkId: ${userId}. Redirecting.`);
    return redirect('/sign-in');
  }
  console.log(`[LearnLayout] Found user document: ${user._id}. Enrolled: ${user.enrolledCourses?.length}, Progress entries: ${user.progress?.length}`);

  const isEnrolled = user.enrolledCourses.some(
    (enrolledCourseId) => enrolledCourseId.toString() === courseIdStr
  );

  if (!isEnrolled) {
    console.log(`[LearnLayout] User ${userId} not enrolled in course ${slug} (${courseIdStr}). Redirecting.`);
    return redirect(`/courses/${slug}?error=not_enrolled`);
  }
  console.log(`[LearnLayout] User ${userId} is enrolled in course ${slug}.`);

  const completedLessonIds = getCompletedLessonIds(user, courseIdStr);

  console.log('[LearnLayout] Data for sidebar:', {
    courseId: courseIdStr,
    moduleCount: serializedCourse.modules.length,
    totalLessons: serializedCourse.modules.reduce((sum, mod) => sum + (mod.lessons?.length || 0), 0),
    completedLessonIdsCount: completedLessonIds.length,
    isEnrolled: isEnrolled
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <CourseSidebar
        course={serializedCourse as any}
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
