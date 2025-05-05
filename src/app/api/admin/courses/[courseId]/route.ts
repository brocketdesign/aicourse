import { NextResponse } from "next/server";
import { connect } from "@/lib/mongodb";
import Course from "@/models/Course";
import Module from "@/models/Module"; // Import Module model
import Lesson from "@/models/Lesson"; // Import Lesson model
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";

// TODO: Add proper authorization check for admin role (e.g., check user role from auth())

// Helper to serialize course for client (convert ObjectId/Date to string)
function serializeCourse(course: any) {
  if (!course) return null;
  // Use toJSON() to handle basic serialization including dates
  const serialized = course.toJSON ? course.toJSON() : { ...course };

  // Ensure IDs are strings
  if (serialized._id) serialized._id = serialized._id.toString();

  if (Array.isArray(serialized.authors)) {
    serialized.authors = serialized.authors.map((a: any) => a?.toString?.() || a);
  }

  // Serialize populated modules and lessons
  if (Array.isArray(serialized.modules)) {
    serialized.modules = serialized.modules.map((mod: any) => {
      if (!mod) return null; // Handle potential nulls if population failed
      const m = mod.toJSON ? mod.toJSON() : { ...mod };
      if (m._id) m._id = m._id.toString();
      if (Array.isArray(m.lessons)) {
        m.lessons = m.lessons.map((lesson: any) => {
          if (!lesson) return null; // Handle potential nulls
          const l = lesson.toJSON ? lesson.toJSON() : { ...lesson };
          if (l._id) l._id = l._id.toString();
          // No need to serialize dates again if toJSON was used
          return l;
        }).filter(Boolean); // Remove nulls
      }
      return m;
    }).filter(Boolean); // Remove nulls
  }
  return serialized;
}

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
    // Populate modules, and within modules, populate lessons
    const course = await Course.findById(courseId)
      .populate({
        path: 'modules',
        model: Module, // Specify the Module model
        options: { sort: { order: 1 } }, // Sort modules by order
        populate: {
          path: 'lessons',
          model: Lesson, // Specify the Lesson model
          options: { sort: { order: 1 } } // Sort lessons by order
        }
      })
      .lean(); // Use lean with populate carefully, or remove lean and use toJSON in serialize

    if (!course) {
      console.log(`[API GET /admin/courses/:courseId] Course not found in database for ID: ${courseId}`); // Log if not found
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    console.log(`[API GET /admin/courses/:courseId] Found course (before serialization):`, course); // Log found course
    // Pass the raw Mongoose object (or lean object) to serialize
    return NextResponse.json(serializeCourse(course));
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
       const parsedPrice = parseFloat(body.price);
       if (!isNaN(parsedPrice)) {
         body.price = Math.round(parsedPrice * 100);
       } else {
         delete body.price;
       }
    }

    // Exclude modules and lessons from direct update via this endpoint
    delete body.modules;
    delete body.lessons;

    const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        { $set: body },
        {
          new: true,
          runValidators: true,
        }
    ); // Don't use lean here if you need to serialize after

    if (!updatedCourse) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    // Re-fetch with population to return the full updated object
    const populatedCourse = await Course.findById(updatedCourse._id)
      .populate({
        path: 'modules',
        model: Module,
        options: { sort: { order: 1 } },
        populate: {
          path: 'lessons',
          model: Lesson,
          options: { sort: { order: 1 } }
        }
      });

    return NextResponse.json(serializeCourse(populatedCourse));
  } catch (error: any) {
    console.error("Error updating course:", error);
    // Handle potential validation errors specifically if needed
    if (error.name === 'ValidationError') {
        return NextResponse.json({ message: "Validation failed", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to update course" }, { status: 500 });
  }
}

// DELETE handler for deleting a course
export async function DELETE(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  // TODO: Add proper authorization check for admin role
  const authResult = await auth(); // Await the auth() call
  if (!authResult?.userId) { // Check for userId on the resolved object
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connect();
    const { courseId } = params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ message: "Invalid Course ID" }, { status: 400 });
    }

    console.log(`[API DELETE /admin/courses/:courseId] Attempting to delete course: ${courseId}`);

    // Optional: Check if the course has associated data (modules, lessons, enrollments) that needs cleanup
    // For simplicity, we'll just delete the course document itself here.
    // A more robust implementation might involve deleting related Modules and Lessons,
    // or preventing deletion if there are active enrollments.

    const deletedCourse = await Course.findByIdAndDelete(courseId);

    if (!deletedCourse) {
      console.log(`[API DELETE /admin/courses/:courseId] Course not found: ${courseId}`);
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    // TODO: Consider deleting associated Modules and Lessons here
    // await Module.deleteMany({ course: courseId });
    // await Lesson.deleteMany({ /* query based on modules of the course */ });
    // TODO: Consider handling enrollments (e.g., unenroll users or archive data)

    console.log(`[API DELETE /admin/courses/:courseId] Course deleted successfully: ${courseId}`);
    return NextResponse.json({ message: "Course deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error(`[API DELETE /admin/courses/:courseId] Error deleting course: ${params.courseId}`, error);
    return NextResponse.json({ message: "Failed to delete course" }, { status: 500 });
  }
}
