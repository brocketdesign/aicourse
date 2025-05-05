import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';
import { auth, currentUser } from '@clerk/nextjs/server';
import { connect } from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Get the base URL for redirects
const getBaseUrl = (request: NextRequest) => {
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
};

export async function GET(request: NextRequest) {
  const authResult = await auth();
  const baseUrl = getBaseUrl(request);

  // If not authenticated, display an error instead of redirecting to sign-in
  // This prevents redirect loops
  if (!authResult.userId) {
    console.error("No userId found during purchase success, user not authenticated");
    return NextResponse.redirect(`${baseUrl}/sign-in?error=auth_required&message=Please+sign+in+to+complete+your+purchase`);
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    console.error("Missing session_id in purchase success request");
    return NextResponse.redirect(`${baseUrl}/dashboard?error=missing_session`);
  }

  try {
    // Get current user from Clerk for user details
    const clerkUser = await currentUser();
    if (!clerkUser) {
      console.error("Could not fetch Clerk user details");
      return NextResponse.redirect(`${baseUrl}/sign-in?error=user_not_found`);
    }

    await connect();

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer'],
    });

    if (session.payment_status !== 'paid') {
      console.log(`Payment not successful: ${session.payment_status}`);
      return NextResponse.redirect(`${baseUrl}/dashboard?purchase=failed`);
    }

    // Extract IDs from metadata
    const clerkUserId = session.metadata?.userId;
    const courseId = session.metadata?.courseId;

    // Verify user ID matches
    if (clerkUserId !== authResult.userId || !courseId) {
      console.error(`User ID mismatch or missing course ID: ${clerkUserId} vs ${authResult.userId}`);
      return NextResponse.redirect(`${baseUrl}/dashboard?error=auth_mismatch`);
    }

    // Find the course by ID
    const course = await Course.findById(courseId);
    if (!course) {
      console.error(`Course not found: ${courseId}`);
      return NextResponse.redirect(`${baseUrl}/dashboard?error=course_not_found`);
    }

    // Find or create the user
    let user = await User.findOne({ clerkId: clerkUserId });

    if (!user) {
      console.log(`Creating new user record for ${clerkUserId}`);
      // Create new user from Clerk data
      user = new User({
        clerkId: clerkUserId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        imageUrl: clerkUser.imageUrl || '',
        enrolledCourses: [course._id],
        role: 'student',
      });
      await user.save();
      console.log(`New user created: ${user._id}`);
    } else if (!user.enrolledCourses.some(id => id.toString() === course._id.toString())) {
      // Add course to user's enrolled courses if not already enrolled
      user.enrolledCourses.push(course._id);
      await user.save();
      console.log(`Course ${course.title} added to user ${user._id}'s enrollments`);
    } else {
      console.log(`User ${user._id} already enrolled in course ${course.title}`);
    }

    // Redirect to the course page or dashboard with success message
    return NextResponse.redirect(`${baseUrl}/dashboard?purchase=success&course=${course.slug}`);
  
  } catch (error) {
    console.error("Error in purchase success handler:", error);
    return NextResponse.redirect(`${baseUrl}/dashboard?error=processing_error`);
  }
}
