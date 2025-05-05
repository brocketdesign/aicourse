import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { connect } from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";

// Determine which API key to use based on environment
const getStripeKey = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction 
    ? process.env.STRIPE_SECRET_KEY_LIVE!
    : process.env.STRIPE_SECRET_KEY!;
};

const stripe = new Stripe(getStripeKey(), {
  apiVersion: "2024-04-10",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = headers();
    const signature = headersList.get("stripe-signature") as string;

    // Verify webhook signature
    let event: Stripe.Event;
    
    try {
      if (!webhookSecret) {
        throw new Error("Missing Stripe webhook secret");
      }
      
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // Connect to MongoDB
    await connect();

    // Handle specific webhook events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (!session.metadata?.courseId || !session.metadata?.userId) {
          console.error("Missing metadata in checkout session");
          return NextResponse.json(
            { error: "Missing metadata" },
            { status: 400 }
          );
        }
        
        const { courseId, userId } = session.metadata;
        
        // Get the subscription ID if available
        const subscriptionId = session.subscription as string;
        
        // Find the user and course
        const user = await User.findById(userId);
        const course = await Course.findById(courseId);
        
        if (!user || !course) {
          console.error("User or course not found");
          return NextResponse.json(
            { error: "User or course not found" },
            { status: 404 }
          );
        }
        
        // Check if the user is already enrolled in this course
        if (user.enrolledCourses.includes(courseId)) {
          return NextResponse.json(
            { message: "User already enrolled in this course" },
            { status: 200 }
          );
        }
        
        // Enroll the user in the course
        user.enrolledCourses.push(courseId);
        
        // Create initial progress record
        user.progress.push({
          courseId,
          completedLessons: [],
          lastAccessedAt: new Date(),
          quizScores: []
        });
        
        // Add subscription details if available
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          user.subscription = {
            stripePriceId: subscription.items.data[0].price.id,
            stripeSubscriptionId: subscriptionId,
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000)
          };
        }
        
        // Increment course enrollment count
        course.enrollmentCount = (course.enrollmentCount || 0) + 1;
        
        // Save changes
        await Promise.all([user.save(), course.save()]);
        
        console.log(`User ${userId} successfully enrolled in course ${courseId}`);
        break;
      }
      
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (!subscriptionId) {
          return NextResponse.json(
            { message: "No subscription ID found" },
            { status: 200 }
          );
        }
        
        // Update subscription status and expiration date
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Find user by subscription ID
        const user = await User.findOne({
          "subscription.stripeSubscriptionId": subscriptionId
        });
        
        if (!user) {
          console.error(`No user found with subscription ID: ${subscriptionId}`);
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }
        
        // Update subscription details
        user.subscription = {
          stripePriceId: subscription.items.data[0].price.id,
          stripeSubscriptionId: subscriptionId,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        };
        
        await user.save();
        console.log(`Updated subscription for user ${user._id}`);
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by subscription ID
        const user = await User.findOne({
          "subscription.stripeSubscriptionId": subscription.id
        });
        
        if (!user) {
          console.error(`No user found with subscription ID: ${subscription.id}`);
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }
        
        // Update subscription status to canceled
        if (user.subscription) {
          user.subscription.status = "canceled";
          await user.save();
          console.log(`Subscription canceled for user ${user._id}`);
        }
        
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}