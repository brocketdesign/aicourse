// src/app/api/admin/courses/[courseId]/modules/[moduleId]/route.ts
import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb';
import Course from '@/models/Course';
import Module from '@/models/Module'; // Import Module model
import Lesson from '@/models/Lesson'; // Import Lesson model
import mongoose from 'mongoose';
import { auth } from "@clerk/nextjs/server"; // Import auth

// Helper function to serialize module
function serializeModule(module: any) {
    if (!module) return null;
    const serialized = module.toJSON ? module.toJSON() : { ...module };
    if (serialized._id) serialized._id = serialized._id.toString();
    if (serialized.course) serialized.course = serialized.course.toString();
    if (Array.isArray(serialized.lessons)) {
        serialized.lessons = serialized.lessons.map((l: any) => l?.toString?.() || l);
    }
    return serialized;
}

// GET a specific module
export async function GET(request: Request, { params }: { params: { courseId: string, moduleId: string } }) {
  // TODO: Add proper authorization check for admin role
  const authResult = await auth(); // Await the auth() call
  if (!authResult?.userId) { // Check for userId on the resolved object
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { courseId, moduleId } = params;

  if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(moduleId)) {
    return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
  }

  try {
    await connect();
    // Find the module and verify it belongs to the course
    const module = await Module.findOne({ _id: moduleId, course: courseId })
        .populate({ // Optionally populate lessons
            path: 'lessons',
            model: Lesson,
            options: { sort: { order: 1 } }
        });

    if (!module) {
      return NextResponse.json({ message: 'Module not found or does not belong to this course' }, { status: 404 });
    }

    // Serialize populated lessons if needed
    const serialized = serializeModule(module);
    if (serialized && Array.isArray(module.lessons)) {
        serialized.lessons = module.lessons.map((lesson: any) => {
            const l = lesson.toJSON ? lesson.toJSON() : { ...lesson };
            if (l._id) l._id = l._id.toString();
            return l;
        });
    }

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('[API_ADMIN_COURSES_MODULE_GET]', error);
    return NextResponse.json({ message: 'Failed to fetch module', error }, { status: 500 });
  }
}

// PUT (update) a specific module
export async function PUT(request: Request, { params }: { params: { courseId: string, moduleId: string } }) {
  // TODO: Add proper authorization check for admin role
  const authResult = await auth(); // Await the auth() call
  if (!authResult?.userId) { // Check for userId on the resolved object
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { courseId, moduleId } = params;

   if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(moduleId)) {
    return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
  }

  try {
    const body = await request.json();
    // Exclude potentially harmful fields or fields managed elsewhere
    const { title, description, order, isPublished } = body;
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = order;
    if (isPublished !== undefined) updateData.isPublished = isPublished; // Assuming Module has isPublished

    await connect();

    // Find and update the module, ensuring it belongs to the correct course
    const updatedModule = await Module.findOneAndUpdate(
        { _id: moduleId, course: courseId },
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!updatedModule) {
      return NextResponse.json({ message: 'Module not found or does not belong to this course' }, { status: 404 });
    }

    return NextResponse.json(serializeModule(updatedModule));
  } catch (error) {
    console.error('[API_ADMIN_COURSES_MODULE_PUT]', error);
    return NextResponse.json({ message: 'Failed to update module', error }, { status: 500 });
  }
}

// DELETE a specific module
export async function DELETE(request: Request, { params }: { params: { courseId: string, moduleId: string } }) {
  // TODO: Add proper authorization check for admin role
  const authResult = await auth(); // Await the auth() call
  if (!authResult?.userId) { // Check for userId on the resolved object
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { courseId, moduleId } = params;

  if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(moduleId)) {
    return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
  }

  const session = await mongoose.startSession(); // Use transaction for multi-step delete
  session.startTransaction();

  try {
    await connect();

    // Find the module to be deleted, ensuring it belongs to the course
    const moduleToDelete = await Module.findOne({ _id: moduleId, course: courseId }).session(session);

    if (!moduleToDelete) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ message: 'Module not found or does not belong to this course' }, { status: 404 });
    }

    // 1. Delete all lessons associated with this module
    await Lesson.deleteMany({ _id: { $in: moduleToDelete.lessons } }).session(session);

    // 2. Remove the module reference from the parent course
    await Course.findByIdAndUpdate(courseId,
        { $pull: { modules: moduleId } },
        { session }
    );

    // 3. Delete the module itself
    await Module.findByIdAndDelete(moduleId).session(session);

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({ message: 'Module and associated lessons deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('[API_ADMIN_COURSES_MODULE_DELETE]', error);
    return NextResponse.json({ message: 'Failed to delete module', error }, { status: 500 });
  }
}
