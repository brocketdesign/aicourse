import { NextResponse } from "next/server";
import { connect } from "@/lib/mongodb";
import Course from "@/models/Course";
import { auth } from "@clerk/nextjs/server";

// Helper function to serialize course data (can be expanded)
function serializeCourse(course: any) {
  if (!course) return null;
  const serialized = course.toJSON ? course.toJSON() : { ...course };
  if (serialized._id) serialized._id = serialized._id.toString();
  // Add other necessary serializations if needed (e.g., authors, dates)
  return serialized;
}

export async function GET(request: Request) {
  // TODO: Add proper authorization check for admin role
  const authResult = await auth(); // Await the auth() call
  if (!authResult?.userId) { // Check for userId on the resolved object
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  // Add admin role check here if available in authResult or user model

  try {
    await connect();
    console.log("[API GET /admin/courses] Fetching all courses");
    const courses = await Course.find({}).sort({ createdAt: -1 }).lean(); // Fetch all, sort by creation, use lean for performance
    console.log(`[API GET /admin/courses] Found ${courses.length} courses`);

    // Serialize each course
    const serializedCourses = courses.map(serializeCourse);

    return NextResponse.json(serializedCourses);
  } catch (error) {
    console.error("[API GET /admin/courses] Error fetching courses:", error);
    return NextResponse.json({ message: "Failed to fetch courses" }, { status: 500 });
  }
}

// TODO: Implement POST handler for creating courses if needed via this route
