// src/app/api/admin/courses/[courseId]/modules/[moduleId]/lessons/route.ts
import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb';
import Course from '@/models/Course';
import Module from '@/models/Module';
import Lesson from '@/models/Lesson';
import { auth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';

// Helper function to serialize lesson
function serializeLesson(lesson: any) {
  if (!lesson) return null;
  const serialized = lesson.toJSON ? lesson.toJSON() : { ...lesson };
  if (serialized._id) serialized._id = serialized._id.toString();
  if (serialized.module) serialized.module = serialized.module.toString();
  // Serialize any dates if needed
  return serialized;
}

// GET handler for fetching all lessons for a specific module
export async function GET(
  request: Request,
  { params }: { params: { courseId: string, moduleId: string } }
) {
  // Authorization check
  const authResult = await auth();
  if (!authResult?.userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connect();
    const { courseId, moduleId } = params;

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(moduleId)) {
      return NextResponse.json({ message: "Invalid Course or Module ID" }, { status: 400 });
    }

    // Check that the module exists and belongs to the course
    const moduleExists = await Module.findOne({ _id: moduleId, course: courseId });
    if (!moduleExists) {
      return NextResponse.json({ message: "Module not found or does not belong to this course" }, { status: 404 });
    }

    console.log(`[API GET /admin/courses/:courseId/modules/:moduleId/lessons] Fetching lessons for module: ${moduleId}`);
    
    // Method 1: Use the module's lessons array (if populated)
    // const lessons = await Lesson.find({ _id: { $in: moduleExists.lessons } }).sort({ order: 1 }).lean();
    
    // Method 2: Query directly using the module field (more reliable)
    const lessons = await Lesson.find({ module: moduleId }).sort({ order: 1 }).lean();
    
    console.log(`[API GET /admin/courses/:courseId/modules/:moduleId/lessons] Found ${lessons.length} lessons`);

    return NextResponse.json(lessons.map(serializeLesson));
  } catch (error) {
    console.error(`[API GET /admin/courses/:courseId/modules/:moduleId/lessons] Error fetching lessons:`, error);
    return NextResponse.json({ message: "Failed to fetch lessons" }, { status: 500 });
  }
}

// POST handler for creating a new lesson within a module
export async function POST(
  request: Request,
  { params }: { params: { courseId: string, moduleId: string } }
) {
  // Authorization check
  const authResult = await auth();
  if (!authResult?.userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connect();
    const { courseId, moduleId } = params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(moduleId)) {
      return NextResponse.json({ message: "Invalid Course or Module ID" }, { status: 400 });
    }

    // Check that the module exists and belongs to the course
    const moduleExists = await Module.findOne({ _id: moduleId, course: courseId });
    if (!moduleExists) {
      return NextResponse.json({ message: "Module not found or does not belong to this course" }, { status: 404 });
    }

    // Determine the order for the new lesson
    const lastLesson = await Lesson.findOne({ module: moduleId }).sort({ order: -1 });
    const newOrder = lastLesson ? lastLesson.order + 1 : 0;

    // Required fields validation
    const { title, description = "", content = "", contentType = "text" } = body;
    
    if (!title) {
      return NextResponse.json({ message: "Lesson title is required" }, { status: 400 });
    }

    console.log(`[API POST /admin/courses/:courseId/modules/:moduleId/lessons] Creating new lesson: ${title}`);

    // Create the new lesson
    const newLesson = new Lesson({
      title,
      description,
      content,
      contentType,
      order: newOrder,
      module: moduleId, // Set the parent module reference
      // Add other fields as needed (duration, isPublished, etc.)
    });

    await newLesson.save();

    // Add the lesson to the module's lessons array
    await Module.findByIdAndUpdate(
      moduleId,
      { $push: { lessons: newLesson._id } }
    );

    console.log(`[API POST /admin/courses/:courseId/modules/:moduleId/lessons] Lesson created successfully: ${newLesson._id}`);

    return NextResponse.json(serializeLesson(newLesson), { status: 201 });
  } catch (error: any) {
    console.error(`[API POST /admin/courses/:courseId/modules/:moduleId/lessons] Error creating lesson:`, error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: "Validation failed", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to create lesson" }, { status: 500 });
  }
}
