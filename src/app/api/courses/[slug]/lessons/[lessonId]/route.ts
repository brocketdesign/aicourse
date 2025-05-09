import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connect } from '@/lib/mongodb';
import Course from '@/models/Course'; // Removed ICourse as it's not used
import Lesson, { ILesson } from '@/models/Lesson'; // Import ILesson
import User from '@/models/User'; // Removed IUser as it's not used
import Module, { IModule } from '@/models/Module';
import mongoose, { Types } from 'mongoose'; // Removed Document as it's not used

// Helper function to find next/prev lesson IDs
async function findAdjacentLessons(courseId: Types.ObjectId, currentLessonId: string): Promise<{ prevLessonId?: string; nextLessonId?: string }> {
  const course = await Course.findById(courseId)
    .populate({
      path: 'modules',
      model: Module,
      options: { sort: { order: 1 } },
      populate: {
        path: 'lessons',
        model: Lesson,
        options: { sort: { order: 1 } },
        select: '_id'
      }
    });

  if (!course || !course.modules) return {};

  const allLessonIds: string[] = [];
  (course.modules as IModule[]).forEach((moduleItem) => { // Renamed module to moduleItem to avoid conflict
    if (moduleItem.lessons) {
      (moduleItem.lessons as { _id: Types.ObjectId }[]).forEach((lesson) => {
        allLessonIds.push(lesson._id.toString());
      });
    }
  });

  const currentIndex = allLessonIds.indexOf(currentLessonId);
  if (currentIndex === -1) return {};

  return {
    prevLessonId: currentIndex > 0 ? allLessonIds[currentIndex - 1] : undefined,
    nextLessonId: currentIndex < allLessonIds.length - 1 ? allLessonIds[currentIndex + 1] : undefined,
  };
}

// GET handler for a specific lesson
export async function GET(
  request: Request,
  context: any // Consider defining a more specific type for context if possible
) {
  const authResult = await auth();
  const userId = authResult?.userId;

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await connect();
    const { slug, lessonId } = context.params;

    // 1. Find the course by slug
    const course = await Course.findOne({ slug });
    if (!course) {
      return new NextResponse('Course not found', { status: 404 });
    }
    const courseId = course._id;

    // 2. Find the lesson by ID and ensure it belongs to the course (via module)
    // Explicitly type lesson
    const lesson: ILesson | null = await Lesson.findById(lessonId).populate('module');
    if (!lesson || (lesson.module as IModule)?.course?.toString() !== courseId.toString()) {
      return new NextResponse('Lesson not found or does not belong to this course', { status: 404 });
    }

    // 3. Check if user is enrolled in the course
    const user = await User.findOne({ clerkId: userId });
    if (!user || !user.enrolledCourses.some(id => id.toString() === courseId.toString())) {
      // Optional: Allow access to previews or first few lessons for non-enrolled users
      // For now, strict enrollment check
      return new NextResponse('User not enrolled in this course', { status: 403 });
    }

    // 4. Get user's progress for this lesson (isCompleted)
    const userProgress = user.progress.find(p => p.courseId.toString() === courseId.toString());
    const isCompleted = userProgress?.completedLessons.some(id => id.toString() === lessonId) || false;

    console.log(`[LESSON_GET] User ${userId} completion status for lesson ${lessonId} in course ${slug}: ${isCompleted}`);

    // 6. Find next/prev lesson IDs
    const { prevLessonId, nextLessonId } = await findAdjacentLessons(courseId, lessonId);

    // 7. Return lesson data, completion status, and navigation IDs
    return NextResponse.json({
      lesson,
      isCompleted,
      prevLessonId,
      nextLessonId,
    });
  } catch (error) {
    console.error('[LESSON_GET]', error);
    // Type the error
    return NextResponse.json({ error: `Internal Server Error: ${(error as Error).message}` }, { status: 500 });
  }
}
