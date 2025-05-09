// src/app/api/admin/courses/[courseId]/modules/[moduleId]/route.ts
import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb';
import Course from '@/models/Course';
import Module, { IModule } from '@/models/Module'; // Import IModule
import Lesson from '@/models/Lesson'; // Import Lesson model
import mongoose from 'mongoose';
import { auth } from "@clerk/nextjs/server"; // Import auth

// Helper function to serialize module
// Explicitly type the module parameter
function serializeModule(module: IModule) {
    return {
        _id: module._id.toString(),
        title: module.title,
        description: module.description,
        order: module.order,
        course: module.course.toString(),
        lessons: module.lessons.map(lessonId => lessonId.toString()), // Assuming lessons are ObjectIds
        createdAt: module.createdAt.toISOString(),
        updatedAt: module.updatedAt.toISOString(),
        isPublished: (module as any).isPublished, // Add isPublished if it exists on your IModule
    };
}

// GET a specific module
export async function GET(request: Request, { params }: { params: { courseId: string, moduleId: string } }) {
  const authResult = await auth();
  if (!authResult?.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  await connect();
  const { courseId, moduleId } = params;

  if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(moduleId)) {
    return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
  }

  try {
    // Explicitly type the module variable
    const moduleData: IModule | null = await Module.findOne({ _id: moduleId, course: courseId }).populate('lessons');
    if (!moduleData) {
      return NextResponse.json({ message: 'Module not found or does not belong to this course' }, { status: 404 });
    }
    return NextResponse.json(serializeModule(moduleData));
  } catch (error) {
    console.error('Error fetching module:', error);
    // Type the error
    return NextResponse.json({ message: 'Failed to fetch module', error: (error as Error).message }, { status: 500 });
  }
}

// PUT (update) a specific module
export async function PUT(request: Request, { params }: { params: { courseId: string, moduleId: string } }) {
  const authResult = await auth();
  if (!authResult?.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { courseId, moduleId } = params;

   if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(moduleId)) {
    return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
  }

  try {
    // Explicitly type body
    const body: Partial<IModule> = await request.json();
    // Exclude potentially harmful fields or fields managed elsewhere
    const { title, description, order, isPublished } = body;
    // Explicitly type updateData
    const updateData: Partial<IModule> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = order;
    if (isPublished !== undefined) (updateData as any).isPublished = isPublished; // Add isPublished if it exists on your IModule

    // Explicitly type updatedModule
    const updatedModule: IModule | null = await Module.findOneAndUpdate(
      { _id: moduleId, course: courseId }, // Ensure module belongs to the course
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('lessons');

    if (!updatedModule) {
      return NextResponse.json({ message: 'Module not found or does not belong to this course' }, { status: 404 });
    }
    return NextResponse.json(serializeModule(updatedModule));
  } catch (error) {
    console.error('Error updating module:', error);
    // Type the error
    return NextResponse.json({ message: 'Failed to update module', error: (error as Error).message }, { status: 500 });
  }
}

// DELETE a specific module
export async function DELETE(request: Request, { params }: { params: { courseId: string, moduleId: string } }) {
  const authResult = await auth();
  if (!authResult?.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { courseId, moduleId } = params;

  if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(moduleId)) {
    return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await connect();

    // Explicitly type moduleToDelete
    const moduleToDelete: IModule | null = await Module.findOne({ _id: moduleId, course: courseId }).session(session);

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
    console.error('Error deleting module:', error);
    // Type the error
    return NextResponse.json({ message: 'Failed to delete module', error: (error as Error).message }, { status: 500 });
  }
}
