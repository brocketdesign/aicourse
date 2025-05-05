// src/app/api/admin/courses/[courseId]/modules/[moduleId]/route.ts
import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb';
import Course from '@/models/Course';
import mongoose from 'mongoose';

// GET a specific module
export async function GET(request: Request, { params }: { params: { courseId: string, moduleId: string } }) {
  const { courseId, moduleId } = params;

  if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(moduleId)) {
    return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
  }

  try {
    await connect();
    const course = await Course.findById(courseId).select('modules');

    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const module = course.modules.id(moduleId); // Mongoose subdocument lookup by _id

    if (!module) {
      return NextResponse.json({ message: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json(module);
  } catch (error) {
    console.error('[API_ADMIN_COURSES_MODULE_GET]', error);
    return NextResponse.json({ message: 'Failed to fetch module', error }, { status: 500 });
  }
}

// PUT (update) a specific module
export async function PUT(request: Request, { params }: { params: { courseId: string, moduleId: string } }) {
  const { courseId, moduleId } = params;

   if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(moduleId)) {
    return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { title, description, order } = body; // Include fields to update

    await connect();
    const course = await Course.findById(courseId);

    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const module = course.modules.id(moduleId);

    if (!module) {
      return NextResponse.json({ message: 'Module not found' }, { status: 404 });
    }

    // Update module fields selectively
    if (title !== undefined) module.title = title;
    if (description !== undefined) module.description = description;
    if (order !== undefined) module.order = order;
    // Add updates for other fields as needed

    await course.save();

    return NextResponse.json(module);
  } catch (error) {
    console.error('[API_ADMIN_COURSES_MODULE_PUT]', error);
    return NextResponse.json({ message: 'Failed to update module', error }, { status: 500 });
  }
}

// DELETE a specific module
export async function DELETE(request: Request, { params }: { params: { courseId: string, moduleId: string } }) {
  const { courseId, moduleId } = params;

  if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(moduleId)) {
    return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
  }

  try {
    await connect();
    const course = await Course.findById(courseId);

    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const module = course.modules.id(moduleId);

    if (!module) {
      return NextResponse.json({ message: 'Module not found' }, { status: 404 });
    }

    // Use Mongoose's pull method for subdocuments
    course.modules.pull({ _id: moduleId });

    await course.save();

    // Re-order remaining modules if necessary (optional, depends on requirements)
    // course.modules.sort((a, b) => a.order - b.order).forEach((mod, index) => mod.order = index + 1);
    // await course.save();


    return NextResponse.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('[API_ADMIN_COURSES_MODULE_DELETE]', error);
    return NextResponse.json({ message: 'Failed to delete module', error }, { status: 500 });
  }
}
