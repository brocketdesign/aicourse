import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { connect } from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User'; // Import User model
import { createProduct, createPrice } from '@/services/stripe';
import mongoose from 'mongoose';

// Initialize Stripe with your secret key (use environment variables!)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil', // Updated to current valid API version
});

export async function POST(request: Request) {
  const authResult = await auth(); // Await the auth() call
  const clerkUser = await currentUser(); // Renamed to avoid conflict

  if (!authResult.userId || !clerkUser) { // Access userId from the resolved object
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Connect to the database
    await connect();

    // Parse request body and log for debugging
    const body = await request.json();
    console.log("[Checkout API] Received request body:", body);

    const { courseId: requestedCourseIdentifier, requestedPriceId } = body; // Use a different name to avoid confusion

    if (!requestedCourseIdentifier) {
      console.error("[Checkout API] Missing course identifier in request.");
      return NextResponse.json({ error: 'Missing course identifier' }, { status: 400 });
    }
    console.log(`[Checkout API] Requested course identifier: ${requestedCourseIdentifier}`);

    // --- Find the course first using the identifier (could be slug or ID) ---
    let course;
    if (mongoose.isValidObjectId(requestedCourseIdentifier)) {
      console.log(`[Checkout API] Identifier ${requestedCourseIdentifier} is a valid ObjectId. Searching by ID.`);
      course = await Course.findById(requestedCourseIdentifier).lean();
    } else {
      console.log(`[Checkout API] Identifier ${requestedCourseIdentifier} is not an ObjectId. Searching by slug.`);
      course = await Course.findOne({ slug: requestedCourseIdentifier }).lean();
    }

    if (!course) {
      console.error(`[Checkout API] Course not found with identifier: ${requestedCourseIdentifier}`);
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    const actualCourseId = course._id.toString(); // Get the actual MongoDB _id as a string
    console.log(`[Checkout API] Found course: ${course.title}, ID: ${actualCourseId}`);
    // --- End find course ---

    // --- Check if user is already enrolled using the actual course ID ---
    const dbUser = await User.findOne({ clerkId: authResult.userId });
    console.log(`[Checkout API] Checking enrollment for user Clerk ID: ${authResult.userId}`);
    if (dbUser) {
        console.log(`[Checkout API] Found user DB ID: ${dbUser._id}. Enrolled courses:`, dbUser.enrolledCourses.map(id => id.toString()));
        const isEnrolled = dbUser.enrolledCourses.some(enrolledCourseId => enrolledCourseId.toString() === actualCourseId);
        console.log(`[Checkout API] Comparing user enrolled IDs with actual course ID (${actualCourseId}). Is enrolled: ${isEnrolled}`);

        if (isEnrolled) {
            console.log(`[Checkout API] User ${authResult.userId} already enrolled in course ${actualCourseId}. Redirecting to dashboard.`);
            const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?alreadyEnrolled=true`;
            return NextResponse.json({ redirectUrl: redirectUrl, message: 'Already enrolled' }, { status: 409 }); // 409 Conflict
        }
    } else {
        console.log(`[Checkout API] User with Clerk ID ${authResult.userId} not found in DB yet.`);
        // If the user isn't in the DB, they can't be enrolled yet.
    }
    // --- End enrollment check ---

    console.log(`[Checkout API] User is not enrolled or not found in DB. Proceeding with checkout for course ID: ${actualCourseId}`);

    // Check if MongoDB is connected (moved check lower as it's not needed for enrollment check)
    if (mongoose.connection.readyState !== 1) {
      console.error('[Checkout API] MongoDB connection is not established');
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    // Ensure course is properly typed
    const typedCourse = course as any; // Type assertion to handle mongoose lean object

    const YOUR_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Use provided price ID or the one stored in course
    let priceId = requestedPriceId || typedCourse.stripePriceId;
    console.log(`[Checkout API] Using Stripe Price ID: ${priceId}`);

    // If no price ID exists or we want to create a new one each time
    if (!priceId) {
      console.log(`[Checkout API] No Stripe Price ID found for course ${actualCourseId}. Creating product and price.`);
      // Create or update product
      // Explicitly type productData
      const productData: { name: string; description?: string; images?: string[]; metadata: { courseId: string } } = {
        name: typedCourse.title,
        description: typedCourse.description,
        images: typedCourse.coverImage ? [typedCourse.coverImage] : undefined,
        metadata: {
          courseId: actualCourseId // Use the actual course ID
        }
      };

      let productId = typedCourse.stripeProductId;

      if (!productId) {
        console.log(`[Checkout API] No Stripe Product ID found. Creating new product.`);
        const product = await createProduct(productData);
        productId = product.id;
        console.log(`[Checkout API] Created Stripe Product ID: ${productId}. Updating course.`);
        await Course.findByIdAndUpdate(typedCourse._id, { stripeProductId: productId });
      } else {
        console.log(`[Checkout API] Found existing Stripe Product ID: ${productId}`);
      }

      // Create price for the product
      const priceData = {
        productId,
        unitAmount: typedCourse.price, // Assuming price is in cents
        currency: 'usd',
        metadata: {
          courseId: actualCourseId // Use the actual course ID
        }
      };
      console.log(`[Checkout API] Creating Stripe Price with data:`, priceData);
      const price = await createPrice(priceData);
      priceId = price.id;
      console.log(`[Checkout API] Created Stripe Price ID: ${priceId}. Updating course.`);
      await Course.findByIdAndUpdate(typedCourse._id, { stripePriceId: priceId });
    }

    // Create Checkout Sessions from body params.
    console.log(`[Checkout API] Creating Stripe Checkout Session for user ${authResult.userId}, course ${actualCourseId}`);
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/api/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/courses/${typedCourse.slug || requestedCourseIdentifier}?canceled=true`,
      metadata: {
        userId: authResult.userId,
        courseId: actualCourseId, // Use the actual course ID
        courseSlug: typedCourse.slug || '',
      },
      customer_email: clerkUser.emailAddresses[0]?.emailAddress,
    });

    if (!session.url) {
       console.error('[Checkout API] Could not create Stripe session URL.');
       return NextResponse.json({ error: 'Could not create Stripe session' }, { status: 500 });
    }

    console.log(`[Checkout API] Stripe session created successfully. Redirecting user to: ${session.url}`);
    // Return the URL for the client to redirect
    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error('[Checkout API] Stripe Checkout Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ 
      error: errorMessage,
      stack: err instanceof Error ? err.stack : undefined
    }, { status: 500 });
  }
}