import { NextResponse } from "next/server";
import { connect } from "@/lib/mongodb";
import Course from "@/models/Course";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";

// TODO: Add proper authorization check for admin role (e.g., check user role from auth())

// GET handler for fetching a single course
export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  console.log(`[API GET /admin/courses/:courseId] Received request for ID: ${params.courseId}`); // Log received ID
  try {
    await connect();
    const { courseId } = params;

    const isValidObjectId = mongoose.Types.ObjectId.isValid(courseId);
    console.log(`[API GET /admin/courses/:courseId] Is ObjectId valid? ${isValidObjectId}`); // Log validation result

    if (!isValidObjectId) {
      console.log(`[API GET /admin/courses/:courseId] Invalid ID format.`);
      return NextResponse.json({ message: "Invalid Course ID" }, { status: 400 });
    }

    console.log(`[API GET /admin/courses/:courseId] Attempting to find course with ID: ${courseId}`);
    const course = await Course.findById(courseId).lean();

    if (!course) {
      console.log(`[API GET /admin/courses/:courseId] Course not found in database for ID: ${courseId}`); // Log if not found
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    console.log(`[API GET /admin/courses/:courseId] Found course:`, course); // Log found course
    return NextResponse.json(course);
  } catch (error) {
    console.error(`[API GET /admin/courses/:courseId] Error fetching course for ID: ${params.courseId}`, error); // Log error
    return NextResponse.json({ message: "Failed to fetch course" }, { status: 500 });
  }
}

// PUT handler for updating a course
export async function PUT(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    await connect();
    const { courseId } = params;
    const body = await request.json();

    // TODO: Add validation for the request body (e.g., using Zod)

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ message: "Invalid Course ID" }, { status: 400 });
    }

    // IMPORTANT: Convert price from dollars (received from form) back to cents for storage
    if (typeof body.price === 'number') {
      body.price = Math.round(body.price * 100);
    } else if (typeof body.price === 'string') {
       // Handle potential string input if necessary, though zod coerce should handle it
       const parsedPrice = parseFloat(body.price);
       if (!isNaN(parsedPrice)) {
         body.price = Math.round(parsedPrice * 100);
       } else {
         // Handle invalid price string if needed
         delete body.price; // Or return validation error
       }
    }

    const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        { $set: body }, // Use $set to update only provided fields
        {
          new: true, // Return the updated document
          runValidators: true, // Run schema validators
        }
    ).lean();

    if (!updatedCourse) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(updatedCourse);
  } catch (error: any) {
    console.error("Error updating course:", error);
    // Handle potential validation errors specifically if needed
    if (error.name === 'ValidationError') {
        return NextResponse.json({ message: "Validation failed", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to update course" }, { status: 500 });
  }
}

// TODO: Implement DELETE handler
// export async function DELETE(
//   request: Request,
//   { params }: { params: { courseId: string } }
// ) { ... }
