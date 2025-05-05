import { clerkClient } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { connect } from '@/lib/mongodb';
import User from '@/models/User';

/**
 * Get the current authenticated user from the database
 * Creates a new user record if it doesn't exist yet
 */
export async function getCurrentUser() {
  const { userId } = auth();
  
  if (!userId) {
    return null;
  }
  
  try {
    // Connect to MongoDB
    await connect();
    
    // Try to find the user in our database
    let user = await User.findOne({ clerkId: userId });
    
    // If user doesn't exist in our database yet, create one based on Clerk data
    if (!user) {
      // Get user data from Clerk
      const clerkUser = await clerkClient.users.getUser(userId);
      
      // Create new user in our database
      user = await User.create({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        imageUrl: clerkUser.imageUrl,
        role: 'student', // Default role
      });
    }
    
    // Update last login time
    user.lastLogin = new Date();
    await user.save();
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}

/**
 * Check if the current user is an instructor
 */
export async function isInstructor() {
  const user = await getCurrentUser();
  return user?.role === 'instructor' || user?.role === 'admin';
}

/**
 * Check if the user has an active subscription
 */
export async function hasActiveSubscription() {
  const user = await getCurrentUser();
  
  if (!user?.subscription) {
    return false;
  }
  
  return (
    user.subscription.status === 'active' || 
    user.subscription.status === 'trialing'
  );
}

/**
 * Enroll a user in a course
 */
export async function enrollInCourse(courseId: string) {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Check if already enrolled
  if (user.enrolledCourses.includes(courseId)) {
    return user;
  }
  
  // Add course to enrolled courses
  user.enrolledCourses.push(courseId);
  
  // Create initial progress record
  user.progress.push({
    courseId,
    completedLessons: [],
    lastAccessedAt: new Date(),
    quizScores: []
  });
  
  await user.save();
  return user;
}

/**
 * Mark a lesson as completed
 */
export async function markLessonCompleted(courseId: string, lessonId: string) {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Find the progress record for this course
  const progressRecord = user.progress.find(
    p => p.courseId.toString() === courseId
  );
  
  if (!progressRecord) {
    throw new Error('User not enrolled in this course');
  }
  
  // Check if already marked as complete
  if (!progressRecord.completedLessons.includes(lessonId)) {
    progressRecord.completedLessons.push(lessonId);
  }
  
  // Update last accessed
  progressRecord.lastAccessedLesson = lessonId;
  progressRecord.lastAccessedAt = new Date();
  
  await user.save();
  return progressRecord;
}

export default {
  getCurrentUser,
  isAdmin,
  isInstructor,
  hasActiveSubscription,
  enrollInCourse,
  markLessonCompleted,
};