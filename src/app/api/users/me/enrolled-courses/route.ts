import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connect } from '@/lib/mongodb';
import User, { IUser } from '@/models/User';
import Course, { ICourse } from '@/models/Course';
import Module from '@/models/Module';
import Lesson from '@/models/Lesson';
import mongoose, { Types, PopulatedDoc } from 'mongoose';

export const dynamic = 'force-dynamic';

// Helper function to count total lessons in a course
async function countLessonsInCourse(courseId: mongoose.Types.ObjectId): Promise<number> {
  try {
    console.log(`[countLessonsInCourse] Counting lessons for course ID: ${courseId} - Revised Approach`);
    // 1. Find the course and get its module IDs
    const course = await Course.findById(courseId).select('modules').lean(); // Only need module IDs

    if (!course || !course.modules || !Array.isArray(course.modules) || course.modules.length === 0) {
      console.log(`[countLessonsInCourse] Course ${courseId} not found or has no modules.`);
      return 0;
    }

    // Ensure module IDs are correctly typed as ObjectIds
    const moduleIds = course.modules.map(id => new Types.ObjectId(id));
    console.log(`[countLessonsInCourse] Found ${moduleIds.length} module IDs for course ${courseId}.`);

    // 2. Count lessons for each module
    let totalLessons = 0;
    for (const moduleId of moduleIds) {
      try {
        // Use countDocuments to efficiently count lessons associated with the module
        const lessonCount = await Lesson.countDocuments({ module: moduleId });
        console.log(`[countLessonsInCourse] Module ${moduleId}: Found ${lessonCount} lessons.`);
        totalLessons += lessonCount;
      } catch (countError) {
        console.error(`[countLessonsInCourse] Error counting lessons for module ${moduleId}:`, countError);
        // Continue counting other modules, but log the error
      }
    }

    console.log(`[countLessonsInCourse] Course ${courseId} total lessons calculated: ${totalLessons}.`);
    return totalLessons;
  } catch (error) {
    console.error(`[countLessonsInCourse] Error counting lessons for course ${courseId}:`, error);
    return 0; // Return 0 on error
  }
}

export async function GET(request: Request) {
  console.log('[API /api/users/me/enrolled-courses] Received GET request');
  const authResult = await auth();
  const userId = authResult?.userId;

  if (!userId) {
    console.error('[API /api/users/me/enrolled-courses] Unauthorized: No userId');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await connect();
    console.log(`[API /api/users/me/enrolled-courses] DB connected. Fetching user for clerkId: ${userId}`);

    const user = await User.findOne({ clerkId: userId })
      .populate({
        path: 'enrolledCourses',
        model: Course,
        select: 'title slug description coverImage price modules _id'
      });

    if (!user) {
      console.error(`[API /api/users/me/enrolled-courses] User not found in DB for clerkId: ${userId}`);
      return new NextResponse('User not found', { status: 404 });
    }
    console.log(`[API /api/users/me/enrolled-courses] Found user: ${user._id}`);
    console.log(`[API /api/users/me/enrolled-courses] User has ${user.enrolledCourses?.length || 0} enrolled courses.`);

    console.log('[API /api/users/me/enrolled-courses] Raw enrolled courses data fetched:', JSON.stringify(user.enrolledCourses, null, 2));

    const enrolledCourses = (user.enrolledCourses as PopulatedDoc<ICourse>[]) || [];

    const enrolledCoursesWithProgress = await Promise.all(
      enrolledCourses.map(async (course) => {
        if (!course || typeof course !== 'object' || !course._id) {
          console.warn('[API /api/users/me/enrolled-courses] Skipping invalid/unpopulated course object:', course);
          return null;
        }

        const courseId = course._id as mongoose.Types.ObjectId;
        const courseIdStr = courseId.toString();
        console.log(`[API /api/users/me/enrolled-courses] Processing course: ${course.title} (${courseIdStr})`);

        const courseProgressData = user.progress.find(
          (p: { courseId: Types.ObjectId; completedLessons: Types.ObjectId[] | string[] }) => p.courseId.equals(courseId)
        );

        const completedLessons = courseProgressData?.completedLessons?.map(id => id.toString()) || [];
        console.log(`[API /api/users/me/enrolled-courses] Course ${courseIdStr}: Found ${completedLessons.length} completed lessons.`);

        const totalLessonsCount = await countLessonsInCourse(courseId);

        const progressPercentage = totalLessonsCount > 0
          ? Math.round((completedLessons.length / totalLessonsCount) * 100)
          : 0;
        console.log(`[API /api/users/me/enrolled-courses] Course ${courseIdStr}: Progress calculated: ${progressPercentage}% (${completedLessons.length}/${totalLessonsCount})`);

        const coverImage = (course as any).coverImage || undefined;

        return {
          _id: courseIdStr,
          title: course.title,
          slug: course.slug,
          description: course.description,
          coverImage: coverImage,
          progress: progressPercentage,
          completedLessonsCount: completedLessons.length,
          totalLessonsCount: totalLessonsCount,
        };
      })
    );

    const validCourses = enrolledCoursesWithProgress.filter(course => course !== null);
    console.log(`[API /api/users/me/enrolled-courses] Returning ${validCourses.length} valid courses with progress.`);

    return NextResponse.json(validCourses);

  } catch (error) {
    console.error('[API /api/users/me/enrolled-courses] Internal Server Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Internal Server Error: ${errorMessage}`, { status: 500 });
  }
}
