import { NextResponse } from "next/server";
import { connect } from "@/lib/mongodb"; // Corrected import name
import Course from "@/models/Course";
import { auth } from "@clerk/nextjs/server";

// TODO: Add proper authorization check for admin role

export async function GET(request: Request) {
  try {
    await connect(); // Corrected function call
    // TODO: Add pagination, sorting, filtering
    const courses = await Course.find({})
      .select("title price isPublished createdAt") // Select specific fields
      .lean(); // Use lean for performance

    // TODO: Fetch actual student count per course if needed (might require aggregation)
    const coursesWithStats = courses.map(course => ({
      ...course,
      id: course._id.toString(), // Ensure ID is a string
      _id: undefined, // Remove original _id
      students: 0, // Placeholder for student count
      status: course.isPublished ? "Published" : "Draft",
    }));

    return NextResponse.json(coursesWithStats);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ message: "Failed to fetch courses" }, { status: 500 });
  }
}

// TODO: Implement POST for creating courses
// export async function POST(request: Request) { ... }
