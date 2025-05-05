import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connect } from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import Module from '@/models/Module';
import Lesson from '@/models/Lesson';
import mongoose from 'mongoose';

// Helper function to count total lessons in a course
async function countLessonsInCourse(courseId: mongoose.Types.ObjectId): Promise<number> {
  try {
    // Add logging at the start of the helper function
    console.log(`[countLessonsInCourse] Counting lessons for course ID: ${courseId}`);
    const course = await Course.findById(courseId).populate({
      path: 'modules',
      select: '_id', // Select only _id for modules
      populate: {
        path: 'lessons',
        model: Lesson, // Explicitly specify model here
        select: '_id' // Only count lessons
      }
    }).lean();

    if (!course || !course.modules) {
      console.log(`[countLessonsInCourse] Course ${courseId} not found or has no modules.`);
      return 0;
    }

    let totalLessons = 0;
    // Ensure modules and lessons are arrays before iterating
    if (Array.isArray(course.modules)) {
      for (const module of course.modules as any[]) { // Cast needed due to lean/populate typing
        if (Array.isArray(module.lessons)) {
          totalLessons += module.lessons.length;
        }
      }
    }
    console.log(`[countLessonsInCourse] Course ${courseId} has ${totalLessons} lessons.`);
    return totalLessons;
  } catch (error) {
    console.error(`[countLessonsInCourse] Error counting lessons for course ${courseId}:`, error);
    return 0; // Return 0 on error to avoid breaking the main route
  }
}

export async function GET(request: Request) {
  // Add logging at the start of the GET handler
  console.log('[API /api/users/me/enrolled-courses] Received GET request.');
  const { userId } = await auth(); // Await here as we need the userId value

  if (!userId) {
    console.error('[API /api/users/me/enrolled-courses] Unauthorized: No userId found.');
    return new NextResponse('Unauthorized', { status: 401 });
  }
  // Log the authenticated user ID
  console.log(`[API /api/users/me/enrolled-courses] Authenticated user: ${userId}`);

  try {
    // Log before connecting to DB
    console.log('[API /api/users/me/enrolled-courses] Connecting to database...');
    await connect();
    // Log after successful connection
    console.log('[API /api/users/me/enrolled-courses] Database connected.');

    // Log before finding the user
    console.log(`[API /api/users/me/enrolled-courses] Finding user with clerkId: ${userId}`);
    const user = await User.findOne({ clerkId: userId })
      .populate({
        path: 'enrolledCourses',
        model: Course, // Explicitly specify the model
        select: 'title slug description imageUrl price modules _id' // Ensure _id is selected
      })
      .lean(); // Use lean for read-only operations

    if (!user) {
      console.error(`[API /api/users/me/enrolled-courses] User not found in DB for clerkId: ${userId}`);
      return new NextResponse('User not found', { status: 404 });
    }
    // Log after finding the user and the number of enrolled courses
    console.log(`[API /api/users/me/enrolled-courses] Found user: ${user._id}`);
    console.log(`[API /api/users/me/enrolled-courses] User has ${user.enrolledCourses?.length || 0} enrolled courses.`);

    // Ensure enrolledCourses is an array
    const enrolledCourses = Array.isArray(user.enrolledCourses) ? user.enrolledCourses : [];

    const enrolledCoursesWithProgress = await Promise.all(
      enrolledCourses.map(async (course: any) => { // Use 'any' carefully, consider defining a populated type
        if (!course || !course._id) {
          // Log if skipping an invalid course object
          console.warn('[API /api/users/me/enrolled-courses] Skipping invalid course object in enrolledCourses:', course);
          return null; // Handle potential null/undefined courses in the array
        }
        const courseIdStr = course._id.toString();
        // Log which course is being processed
        console.log(`[API /api/users/me/enrolled-courses] Processing course: ${course.title} (${courseIdStr})`);

        // Safely access progress map
        const userProgressMap = user.progress instanceof Map ? user.progress : new Map();
        const completedLessons = userProgressMap.get(courseIdStr) || [];
        // Log the number of completed lessons found
        console.log(`[API /api/users/me/enrolled-courses] Course ${courseIdStr}: Found ${completedLessons.length} completed lessons in progress map.`);

        const totalLessons = await countLessonsInCourse(course._id);

        const progressPercentage = totalLessons > 0
          ? Math.round((completedLessons.length / totalLessons) * 100)
          : 0;
        // Log the calculated progress
        console.log(`[API /api/users/me/enrolled-courses] Course ${courseIdStr}: Progress calculated: ${progressPercentage}% (${completedLessons.length}/${totalLessons})`);

        return {
          ...course,
          progress: progressPercentage,
          completedLessonsCount: completedLessons.length,
          totalLessonsCount: totalLessons,
        };
      })
    );

    // Filter out any null results from the map (e.g., from invalid course objects)
    const validCourses = enrolledCoursesWithProgress.filter(course => course !== null);
    // Log the final count of courses being returned
    console.log(`[API /api/users/me/enrolled-courses] Returning ${validCourses.length} valid courses with progress.`);

    return NextResponse.json(validCourses);

  } catch (error) {
    // Log the full error in the catch block
    console.error('[API /api/users/me/enrolled-courses] Internal Server Error:', error);
    // Log the specific error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Internal Server Error: ${errorMessage}`, { status: 500 });
  }
}
