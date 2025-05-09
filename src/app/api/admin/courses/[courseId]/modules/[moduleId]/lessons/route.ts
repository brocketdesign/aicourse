// src/app/api/admin/courses/[courseId]/modules/[moduleId]/lessons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb';
import Module from '@/models/Module';
import Lesson, { ILesson } from '@/models/Lesson'; // Import ILesson
import mongoose from 'mongoose';
import { auth } from "@clerk/nextjs/server";

// Helper to serialize lesson (convert ObjectId/Date to string, etc.)
// Explicitly type the lesson parameter
function serializeLesson(lesson: ILesson) {
  return {
    _id: lesson._id.toString(),
    title: lesson.title,
    content: lesson.content,
    order: lesson.order,
    module: lesson.module.toString(),
    // Add other fields from ILesson as needed
    // Example: Assuming ILesson has these from your screenshot context
    contentType: (lesson as any).contentType, // Cast to any if contentType is not in ILesson yet
    mediaUrl: (lesson as any).mediaUrl,
    duration: (lesson as any).duration,
    isPublished: (lesson as any).isPublished,
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
  };
}

// GET all lessons for a module
export async function GET(request: NextRequest, { params }: { params: { courseId: string, moduleId: string } }) {
  const authResult = await auth();
  if (!authResult?.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  await connect();
  const { moduleId } = params;

  if (!mongoose.Types.ObjectId.isValid(moduleId)) {
    return new NextResponse("Invalid Module ID format", { status: 400 });
  }

  try {
    // Explicitly type lessons
    const lessons: ILesson[] = await Lesson.find({ module: moduleId }).sort({ order: 'asc' });
    return NextResponse.json(lessons.map(serializeLesson));
  } catch (error) {
    console.error("[LESSONS_GET_ALL]", error);
    // Type the error
    return new NextResponse(`Internal Server Error: ${(error as Error).message}`, { status: 500 });
  }
}

// POST a new lesson to a module
export async function POST(request: NextRequest, { params }: { params: { courseId: string, moduleId: string } }) {
  const authResult = await auth();
  if (!authResult?.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  await connect();
  const { moduleId } = params;
  // Explicitly type body
  const body: Partial<ILesson> = await request.json();
  const { title, content, order, contentType, mediaUrl, duration, isPublished } = body;

  if (!mongoose.Types.ObjectId.isValid(moduleId)) {
    return new NextResponse("Invalid Module ID format", { status: 400 });
  }

  if (!title || order === undefined) { // Ensure order is provided
    return new NextResponse("Missing required fields: title and order", { status: 400 });
  }

  // Find the module to ensure it exists
  const parentModule = await Module.findById(moduleId);
  if (!parentModule) {
    return new NextResponse("Module not found", { status: 404 });
  }

  try {
    // Explicitly type newLesson
    const newLesson: ILesson = new Lesson({
      title,
      content,
      order,
      module: moduleId,
      contentType,
      mediaUrl,
      duration,
      isPublished: isPublished || false, // Default to false if not provided
    });
    await newLesson.save();

    // Add lesson to module's lessons array
    parentModule.lessons.push(newLesson._id);
    await parentModule.save();

    return NextResponse.json(serializeLesson(newLesson), { status: 201 });
  } catch (error) {
    console.error("[LESSON_POST]", error);
    if (error instanceof mongoose.Error.ValidationError) {
      return new NextResponse(JSON.stringify({ message: "Validation Error", errors: error.errors }), { status: 400 });
    }
    // Type the error
    return new NextResponse(`Internal Server Error: ${(error as Error).message}`, { status: 500 });
  }
}
