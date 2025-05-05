// src/app/api/admin/courses/[courseId]/modules/route.ts
import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb'; // Corrected import name
import Course from '@/models/Course';
import mongoose from 'mongoose';

// GET all modules for a course
export async function GET(request: Request, { params }: { params: { courseId: string } }) {
  const { courseId } = params;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return NextResponse.json({ message: 'Invalid Course ID format' }, { status: 400 });
  }

  try {
    await connect(); // Use correct function name
    const course = await Course.findById(courseId).select('modules');

    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json(course.modules);
  } catch (error) {
    console.error('[API_ADMIN_COURSES_MODULES_GET]', error);
    return NextResponse.json({ message: 'Failed to fetch modules', error }, { status: 500 });
  }
}

// POST a new module to a course
export async function POST(request: Request, { params }: { params: { courseId: string } }) {
  const { courseId } = params;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return NextResponse.json({ message: 'Invalid Course ID format' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { title, description } = body; // Add other module fields as needed

    if (!title || !description) {
      return NextResponse.json({ message: 'Missing required module fields (title, description)' }, { status: 400 });
    }

    await connect(); // Use correct function name
    const course = await Course.findById(courseId);

    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Determine the order for the new module
    const newOrder = course.modules.length > 0 ? Math.max(...course.modules.map((m: { order: number }) => m.order)) + 1 : 1;

    const newModule = {
      _id: new mongoose.Types.ObjectId(), // Generate a new ObjectId for the module
      title,
      description,
      order: newOrder,
      lessons: [], // Initialize with empty lessons array
      // Add default values for other ModuleSchema fields if necessary
    };

    course.modules.push(newModule);
    await course.save();

    return NextResponse.json(newModule, { status: 201 });
  } catch (error) {
    console.error('[API_ADMIN_COURSES_MODULES_POST]', error);
    return NextResponse.json({ message: 'Failed to add module', error }, { status: 500 });
  }
}
