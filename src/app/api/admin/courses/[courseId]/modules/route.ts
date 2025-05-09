// src/app/api/admin/courses/[courseId]/modules/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb';
import Course from '@/models/Course';
import Module, { IModule } from '@/models/Module'; // Import IModule
import mongoose from 'mongoose';
import { auth } from "@clerk/nextjs/server";

// Helper function to serialize module (ensure all fields are correctly typed and stringified if needed)
// Explicitly type the module parameter
function serializeModule(moduleDoc: IModule) {
    return {
        _id: moduleDoc._id.toString(),
        title: moduleDoc.title,
        description: moduleDoc.description,
        order: moduleDoc.order,
        course: moduleDoc.course.toString(),
        lessons: moduleDoc.lessons.map(lessonId => lessonId.toString()),
        isPublished: (moduleDoc as any).isPublished, // Add isPublished if it exists on your IModule
        createdAt: moduleDoc.createdAt.toISOString(),
        updatedAt: moduleDoc.updatedAt.toISOString(),
    };
}

// GET all modules for a course
export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
    const authResult = await auth();
    if (!authResult?.userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    await connect();
    const { courseId } = params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return NextResponse.json({ message: 'Invalid Course ID format' }, { status: 400 });
    }

    try {
        // Explicitly type modules
        const modules: IModule[] = await Module.find({ course: courseId }).sort({ order: 'asc' }).populate('lessons');
        return NextResponse.json(modules.map(serializeModule));
    } catch (error) {
        console.error('Error fetching modules:', error);
        // Type the error
        return NextResponse.json({ message: 'Failed to fetch modules', error: (error as Error).message }, { status: 500 });
    }
}

// POST a new module to a course
export async function POST(request: NextRequest, { params }: { params: { courseId: string } }) {
    const authResult = await auth();
    if (!authResult?.userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    await connect();
    const { courseId } = params;
    // Explicitly type body
    const body: Partial<IModule> = await request.json();
    const { title, description, order, isPublished } = body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return NextResponse.json({ message: 'Invalid Course ID format' }, { status: 400 });
    }

    if (!title || !description || order === undefined) { // Ensure order is provided
        return NextResponse.json({ message: 'Missing required fields: title, description, and order' }, { status: 400 });
    }

    // Find the parent course to ensure it exists
    const parentCourse = await Course.findById(courseId);
    if (!parentCourse) {
        return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    try {
        // Explicitly type newModule
        const newModule: IModule = new Module({
            title,
            description,
            order,
            course: courseId,
            lessons: [], // Initialize with empty lessons array
            isPublished: isPublished || false, // Default to false
        });
        await newModule.save();

        // Add module to course's modules array
        parentCourse.modules.push(newModule._id);
        await parentCourse.save();

        return NextResponse.json(serializeModule(newModule), { status: 201 });
    } catch (error) {
        console.error('Error creating module:', error);
        if (error instanceof mongoose.Error.ValidationError) {
            return NextResponse.json({ message: "Validation Error", errors: error.errors }, { status: 400 });
        }
        // Type the error
        return NextResponse.json({ message: 'Failed to create module', error: (error as Error).message }, { status: 500 });
    }
}
