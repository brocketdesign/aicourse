import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connect } from '@/lib/mongodb';
import Course, { ICourse } from '@/models/Course';
import Lesson from '@/models/Lesson';
import User, { IUser } from '@/models/User';
import Module, { IModule } from '@/models/Module';
import mongoose, { Types, Document } from 'mongoose';

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
  (course.modules as IModule[]).forEach((module) => {
    if (module.lessons) {
      (module.lessons as { _id: Types.ObjectId }[]).forEach((lesson) => {
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
  context: any
) {
  const { userId } = await auth();
  const params = await context.params;
  const { slug, lessonId } = params;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!mongoose.Types.ObjectId.isValid(lessonId)) {
    return NextResponse.json({ error: 'Invalid Lesson ID' }, { status: 400 });
  }

  try {
    await connect();

    // 1. Find the course by slug
    const course = await Course.findOne({ slug }).select('_id');
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    const courseId = course._id;
    const courseIdStr = courseId.toString();

    // 2. Fetch the full user document to access progress consistently
    const user = await User.findOne({ clerkId: userId }).select('enrolledCourses progress');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[LESSON_GET] Looking for lesson', { lessonId, courseId: courseIdStr, slug });

    // 3. Find the lesson
    const lesson = await Lesson.findById(lessonId).lean();
    console.log('[LESSON_GET] Lesson lookup result:', lesson);
    if (!lesson) {
      console.log('[LESSON_GET] Lesson not found for lessonId:', lessonId);
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // 4. Check if the lesson belongs to the course (using courseId ObjectId)
    const moduleContainingLesson = await Module.findOne({ course: courseId, lessons: new Types.ObjectId(lessonId) }).select('_id').lean();
    if (!moduleContainingLesson) {
      return NextResponse.json({ error: 'Forbidden: Lesson does not belong to this course' }, { status: 403 });
    }

    // 5. Determine completion status consistently with POST route
    let isCompleted = false;
    const courseProgress = user.progress.find(
      (p) => p.courseId.equals(courseId)
    );

    if (courseProgress) {
      try {
        const lessonObjectId = new Types.ObjectId(lessonId);
        isCompleted = courseProgress.completedLessons.some(
          (id: Types.ObjectId) => id.equals(lessonObjectId)
        );
      } catch (e) {
        console.error(`[LESSON_GET] Error converting lessonId ${lessonId} to ObjectId:`, e);
      }
    }

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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
