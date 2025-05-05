// src/app/api/admin/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb';
import Lesson from '@/models/Lesson';
import Module from '@/models/Module';
import mongoose from 'mongoose'; // Import mongoose

// Helper function to serialize lesson
function serializeLesson(lesson: any) {
    if (!lesson) return null;
    const serialized = lesson.toJSON ? lesson.toJSON() : { ...lesson };
    if (serialized._id) serialized._id = serialized._id.toString();
    if (serialized.module) serialized.module = serialized.module.toString();
    return serialized;
}

// GET a specific lesson
export async function GET(request: NextRequest, { params }: { params: { courseId: string, moduleId: string, lessonId: string } }) {
    await connect();
    const { moduleId, lessonId } = params; // courseId might not be needed but good for validation

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(moduleId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
        return new NextResponse("Invalid Module or Lesson ID format", { status: 400 });
    }

    try {
        // Find the lesson and verify it belongs to the module
        const lesson = await Lesson.findOne({ _id: lessonId, module: moduleId });
        if (!lesson) {
            return new NextResponse("Lesson not found or does not belong to this module", { status: 404 });
        }
        return NextResponse.json(serializeLesson(lesson));
    } catch (error: any) {
        console.error("[LESSON_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// PUT (update) a specific lesson
export async function PUT(request: NextRequest, { params }: { params: { courseId: string, moduleId: string, lessonId: string } }) {
    await connect();
    const { moduleId, lessonId } = params;
    const body = await request.json();
    // Extract all potential fields from ILesson
    const {
        title,
        description,
        content,
        contentType,
        mediaUrl,
        order,
        duration,
        isPublished
    }: Partial<InstanceType<typeof Lesson>> = body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(moduleId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
        return new NextResponse("Invalid Module or Lesson ID format", { status: 400 });
    }

    // Basic validation (add more as needed)
    if (!title) {
        return new NextResponse("Title is required", { status: 400 });
    }

    try {
        // Construct update object with only provided fields
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (content !== undefined) updateData.content = content;
        if (contentType !== undefined) updateData.contentType = contentType;
        if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl;
        if (order !== undefined) updateData.order = order;
        if (duration !== undefined) updateData.duration = duration;
        if (isPublished !== undefined) updateData.isPublished = isPublished;

        const updatedLesson = await Lesson.findOneAndUpdate(
            { _id: lessonId, module: moduleId }, // Ensure lesson belongs to the module
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedLesson) {
            return new NextResponse("Lesson not found or does not belong to this module", { status: 404 });
        }

        // If order was changed, you might need to re-order other lessons in the module (complex logic, omitted for brevity)

        return NextResponse.json(serializeLesson(updatedLesson));
    } catch (error: any) {
        console.error("[LESSON_PUT]", error);
        if (error.name === 'ValidationError') {
            let errors = {};
            Object.keys(error.errors).forEach((key) => {
                //@ts-ignore
                errors[key] = error.errors[key].message;
            });
            return new NextResponse(JSON.stringify({ message: "Validation Error", errors }), { status: 400 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// DELETE a specific lesson
export async function DELETE(request: NextRequest, { params }: { params: { courseId: string, moduleId: string, lessonId: string } }) {
    await connect();
    const { moduleId, lessonId } = params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(moduleId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
        return new NextResponse("Invalid Module or Lesson ID format", { status: 400 });
    }

    const session = await mongoose.startSession(); // Use transaction
    session.startTransaction();

    try {
        // Find and delete the lesson, ensuring it belongs to the module
        const deletedLesson = await Lesson.findOneAndDelete({ _id: lessonId, module: moduleId }).session(session);

        if (!deletedLesson) {
            await session.abortTransaction();
            session.endSession();
            return new NextResponse("Lesson not found or does not belong to this module", { status: 404 });
        }

        // Remove the lesson reference from the parent module
        await Module.findByIdAndUpdate(moduleId,
            { $pull: { lessons: lessonId } },
            { session }
        );

        // Optional: Re-order remaining lessons if necessary

        await session.commitTransaction();
        session.endSession();

        return new NextResponse(null, { status: 204 }); // No content on successful delete
    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        console.error("[LESSON_DELETE]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
