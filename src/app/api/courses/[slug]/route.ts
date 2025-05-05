import { NextResponse } from 'next/server';

// Mock data for courses
const courses = {
  "ai-monetization": {
    _id: "ai-monetization",
    title: "AI Monetization Mastery",
    description: "Learn how to build and monetize AI tools",
    price: 299,
    stripePriceId: "price_123abc",
    // Add more course data as needed
  }
};

export async function GET(request, { params }) {
  const { slug } = params;
  
  if (!courses[slug]) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  
  return NextResponse.json(courses[slug]);
}
