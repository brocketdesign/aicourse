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
        course: moduleDoc.course.toString(), // This should be an ObjectId, so .toString() is fine.
        lessons: moduleDoc.lessons && Array.isArray(moduleDoc.lessons)
            ? moduleDoc.lessons.map(lesson => lesson._id ? lesson._id.toString() : lesson.toString()) // Handle populated lesson objects
            : [],
        isPublished: (moduleDoc as any).isPublished,
        createdAt: moduleDoc.createdAt ? moduleDoc.createdAt.toISOString() : null,
        updatedAt: moduleDoc.updatedAt ? moduleDoc.updatedAt.toISOString() : null,
    };
}

export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
    console.log(`[API /admin/courses/${params.courseId}/modules] GET request received.`);
    try {
        const authResult = await auth();
        if (!authResult?.userId) {
            console.warn(`[API /admin/courses/${params.courseId}/modules] Unauthorized access attempt.`);
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        await connect();
        const { courseId } = params;
        console.log(`[API /admin/courses/${courseId}/modules] Fetching modules for courseId:`, courseId);
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            console.warn(`[API /admin/courses/${courseId}/modules] Invalid courseId format.`);
            return NextResponse.json({ message: "Invalid Course ID format" }, { status: 400 });
        }
        const modules = await Module.find({ course: courseId }).sort({ order: 1 });
        console.log(`[API /admin/courses/${courseId}/modules] Found ${modules.length} modules.`);
        return NextResponse.json(modules.map(serializeModule));
    } catch (error) {
        console.error(`[API /admin/courses/${params.courseId}/modules] Error:`, error);
        return NextResponse.json({ message: "Failed to fetch modules", error: (error as Error).message }, { status: 500 });
    }
}
