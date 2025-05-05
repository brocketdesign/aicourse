// src/app/api/admin/courses/[courseId]/modules/route.ts
import { NextResponse } from "next/server";
import { connect } from "@/lib/mongodb";
import Course from "@/models/Course";
import Module from "@/models/Module";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";

// Helper to serialize module data
function serializeModule(module: any) {
  if (!module) return null;
  const serialized = module.toJSON ? module.toJSON() : { ...module };
  if (serialized._id) serialized._id = serialized._id.toString();
  if (serialized.course) serialized.course = serialized.course.toString();
  // Add lesson serialization if needed later
  return serialized;
}

// GET handler for fetching all modules for a specific course
export async function GET(
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

    console.log(`[API GET /admin/courses/:courseId/modules] Fetching modules for course: ${courseId}`);
    const modules = await Module.find({ course: courseId }).sort({ order: 1 }).lean();
    console.log(`[API GET /admin/courses/:courseId/modules] Found ${modules.length} modules`);

    return NextResponse.json(modules.map(serializeModule));
  } catch (error) {
    console.error(`[API GET /admin/courses/:courseId/modules] Error fetching modules:`, error);
    return NextResponse.json({ message: "Failed to fetch modules" }, { status: 500 });
  }
}

// POST handler for creating a new module for a specific course
export async function POST(
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
    const body = await request.json();

    // TODO: Add validation for the request body (e.g., using Zod)
    const { title } = body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ message: "Invalid Course ID" }, { status: 400 });
    }

    // Check if course exists
    const courseExists = await Course.findById(courseId);
    if (!courseExists) {
        return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    // Determine the order for the new module
    const lastModule = await Module.findOne({ course: courseId }).sort({ order: -1 });
    const newOrder = lastModule ? lastModule.order + 1 : 0;

    console.log(`[API POST /admin/courses/:courseId/modules] Creating new module with title: ${title}, order: ${newOrder}`);

    const newModule = new Module({
      title,
      course: courseId,
      order: newOrder,
      lessons: [] // Initialize with empty lessons
    });

    await newModule.save();

    // Add the new module's ID to the course's modules array
    await Course.findByIdAndUpdate(courseId, { $push: { modules: newModule._id } });

    console.log(`[API POST /admin/courses/:courseId/modules] Module created successfully: ${newModule._id}`);

    return NextResponse.json(serializeModule(newModule), { status: 201 });
  } catch (error: any) {
    console.error(`[API POST /admin/courses/:courseId/modules] Error creating module:`, error);
    if (error.name === 'ValidationError') {
        return NextResponse.json({ message: "Validation failed", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to create module" }, { status: 500 });
  }
}
