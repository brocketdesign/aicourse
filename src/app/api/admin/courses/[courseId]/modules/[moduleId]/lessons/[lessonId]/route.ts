// src/app/api/admin/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb';
import Module from '@/models/Module';
import Lesson, { ILesson } from '@/models/Lesson'; // Import ILesson
import mongoose from 'mongoose';

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
        // Explicitly type the lesson variable
        const lesson: ILesson | null = await Lesson.findOne({ _id: lessonId, module: moduleId });
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
    }: Partial<ILesson> = body; // Use ILesson here

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
        // Explicitly type updateData
        const updateData: Partial<ILesson> = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) (updateData as any).description = description; // Add description if it's part of your lesson schema
        if (content !== undefined) updateData.content = content;
        if (contentType !== undefined) (updateData as any).contentType = contentType;
        if (mediaUrl !== undefined) (updateData as any).mediaUrl = mediaUrl;
        if (order !== undefined) updateData.order = order;
        if (duration !== undefined) (updateData as any).duration = duration;
        if (isPublished !== undefined) (updateData as any).isPublished = isPublished;

        // Explicitly type updatedLesson
        const updatedLesson: ILesson | null = await Lesson.findOneAndUpdate(
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
            const errors: Record<string, string> = {};
            Object.keys(error.errors).forEach((key) => {
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
        // Explicitly type deletedLesson
        const deletedLesson: ILesson | null = await Lesson.findOneAndDelete({ _id: lessonId, module: moduleId }).session(session);

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
