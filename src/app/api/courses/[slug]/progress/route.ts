import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connect } from '@/lib/mongodb';
import User, { IUser } from '@/models/User';
import Course, { ICourse } from '@/models/Course';
import mongoose, { Types } from 'mongoose';

// GET user progress for a specific course
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const authResult = await auth();
  const userId = authResult?.userId;
  const { slug } = params;

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await connect();

    // Use lean and assert type for course
    const course = await Course.findOne({ slug }).lean() as ICourse | null;
    if (!course) {
      return new NextResponse('Course not found', { status: 404 });
    }
    const courseId = course._id as Types.ObjectId; // Assert type

    // Use lean and assert type for user
    const user = await User.findOne({ clerkId: userId }).lean() as IUser | null;
    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Ensure enrolledCourses exists before checking
    const isEnrolled = user.enrolledCourses?.some(
      (enrolledCourseId: Types.ObjectId) => enrolledCourseId.equals(courseId) // Use .equals for ObjectId comparison
    ) || false;
    if (!isEnrolled) {
      return new NextResponse('Not enrolled in this course', { status: 403 });
    }

    // Find the progress object for this specific course within the array
    const courseProgressData = user.progress?.find(
      (p) => p.courseId.equals(courseId) // Use .equals for ObjectId comparison
    );

    const completedLessonIds = courseProgressData?.completedLessons?.map(
      (id: Types.ObjectId) => id.toString()
    ) || [];

    return NextResponse.json({ completedLessonIds });

  } catch (error) {
    console.error('[COURSE_PROGRESS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST to update user progress (mark lesson complete)
export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  console.log('[COURSE_PROGRESS_POST] Received request');
  const authResult = await auth();
  const userId = authResult?.userId;
  const { slug } = params;
  let lessonId: string | null = null;

  try {
    const body = await request.json();
    lessonId = body.lessonId;
    console.log(`[COURSE_PROGRESS_POST] Parsed body. User ID: ${userId}, Slug: ${slug}, Lesson ID: ${lessonId}`);

    if (!userId) {
      console.log('[COURSE_PROGRESS_POST] Unauthorized: No userId found in auth context.');
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (!lessonId) {
      console.log('[COURSE_PROGRESS_POST] Bad Request: Missing lessonId in request body.');
      return new NextResponse('Missing lessonId', { status: 400 });
    }

    await connect();
    console.log('[COURSE_PROGRESS_POST] Database connected successfully.');

    // Use lean and assert type for course
    const course = await Course.findOne({ slug }).lean() as ICourse | null;
    if (!course) {
      console.log(`[COURSE_PROGRESS_POST] Course not found for slug: ${slug}`);
      return new NextResponse('Course not found', { status: 404 });
    }
    const courseId = course._id as Types.ObjectId; // Assert type
    console.log(`[COURSE_PROGRESS_POST] Found course with ID: ${courseId.toString()}`);

    // Fetch the user document *without* lean() but assert the type
    const user = await User.findOne({ clerkId: userId }) as IUser | null;
    if (!user) {
      console.log(`[COURSE_PROGRESS_POST] User not found for clerkId: ${userId}`);
      return new NextResponse('User not found', { status: 404 });
    }
    const userObjectId = user._id as Types.ObjectId; // Assert type
    console.log(`[COURSE_PROGRESS_POST] Found user with ID: ${userObjectId.toString()}`);

    // Ensure enrolledCourses exists before checking
    const isEnrolled = user.enrolledCourses?.some(
      (enrolledCourseId: Types.ObjectId) => enrolledCourseId.equals(courseId) // Use .equals for ObjectId comparison
    ) || false;
    console.log(`[COURSE_PROGRESS_POST] Is user enrolled? ${isEnrolled}`);
    if (!isEnrolled) {
      console.log(`[COURSE_PROGRESS_POST] User ${userObjectId.toString()} is not enrolled in course ${courseId.toString()}.`);
      return new NextResponse('Not enrolled in this course', { status: 403 });
    }

    // Find the progress subdocument for this course
    let courseProgress = user.progress.find(
      (p) => p.courseId.equals(courseId) // Use .equals for ObjectId comparison
    );

    let lessonObjectId: Types.ObjectId;
    try {
      lessonObjectId = new Types.ObjectId(lessonId);
    } catch (conversionError) {
      console.error(`[COURSE_PROGRESS_POST] Invalid lessonId format: ${lessonId}`, conversionError);
      return new NextResponse('Invalid lessonId format', { status: 400 });
    }

    let lessonAlreadyCompleted = false;
    if (courseProgress) {
      lessonAlreadyCompleted = courseProgress.completedLessons.some(
        (id: Types.ObjectId) => id.equals(lessonObjectId)
      );
      console.log(`[COURSE_PROGRESS_POST] Found existing progress for course. Is lesson ${lessonId} already completed? ${lessonAlreadyCompleted}`);

      if (!lessonAlreadyCompleted) {
        courseProgress.completedLessons.push(lessonObjectId);
        console.log(`[COURSE_PROGRESS_POST] Added lesson ${lessonId} to existing progress.`);
      }
    } else {
      console.log(`[COURSE_PROGRESS_POST] No existing progress found for course ${courseId.toString()}. Creating new entry.`);
      // Create the new progress object - ensure courseId is ObjectId
      const newProgressEntry = {
        courseId: courseId, // Already asserted as ObjectId
        completedLessons: [lessonObjectId]
      };
      user.progress.push(newProgressEntry); // Push the correctly typed object
      // Update the reference to the newly added progress object
      courseProgress = newProgressEntry;
    }

    if (!lessonAlreadyCompleted) {
      await user.save();
      console.log(`[COURSE_PROGRESS_POST] User progress saved successfully for user ${userObjectId.toString()}`);
    } else {
      console.log(`[COURSE_PROGRESS_POST] Lesson ${lessonId} already marked as complete. No save needed.`);
    }

    // Retrieve the final state directly from the potentially updated user document
    // Ensure courseProgress is not undefined before accessing its properties
    const finalCompletedIds = courseProgress?.completedLessons.map((id: Types.ObjectId) => id.toString()) || [];

    console.log(`[COURSE_PROGRESS_POST] Returning success response with completed IDs:`, finalCompletedIds);
    return NextResponse.json({ success: true, completedLessonIds: finalCompletedIds });

  } catch (error: any) {
    console.error(`[COURSE_PROGRESS_POST] Error processing request for slug: ${slug}, lessonId: ${lessonId}, userId: ${userId}. Error:`, error);
    if (error instanceof Error) {
      console.error(`[COURSE_PROGRESS_POST] Error message: ${error.message}`);
      console.error(`[COURSE_PROGRESS_POST] Error stack: ${error.stack}`);
    } else {
      console.error('[COURSE_PROGRESS_POST] An unknown error object was caught:', error);
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
