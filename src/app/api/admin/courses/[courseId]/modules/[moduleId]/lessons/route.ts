// src/app/api/admin/courses/[courseId]/modules/[moduleId]/lessons/route.ts
import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb';
import Course from '@/models/Course';
import mongoose from 'mongoose';

// GET all lessons for a specific module
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

        const module = course.modules.id(moduleId);
        if (!module) {
            return NextResponse.json({ message: 'Module not found' }, { status: 404 });
        }

        // Sort lessons by order before returning
        const sortedLessons = module.lessons.sort((a: { order: number }, b: { order: number }) => a.order - b.order);

        return NextResponse.json(sortedLessons);
    } catch (error) {
        console.error('[API_ADMIN_LESSONS_GET]', error);
        return NextResponse.json({ message: 'Failed to fetch lessons', error }, { status: 500 });
    }
}

// POST a new lesson to a specific module
export async function POST(request: Request, { params }: { params: { courseId: string, moduleId: string } }) {
    const { courseId, moduleId } = params;

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(moduleId)) {
        return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    try {
        const body = await request.json();
        // Destructure all required lesson fields from the body
        const { title, description, content, contentType, duration, isPublished = false, mediaUrl } = body;

        // Basic validation
        if (!title || !description || !content || !contentType || duration === undefined) {
            return NextResponse.json({ message: 'Missing required lesson fields' }, { status: 400 });
        }
        // Validate contentType enum
        const validContentTypes = ['text', 'video', 'audio', 'quiz', 'code', 'chat'];
        if (!validContentTypes.includes(contentType)) {
             return NextResponse.json({ message: `Invalid contentType: ${contentType}` }, { status: 400 });
        }


        await connect();
        const course = await Course.findById(courseId);
        if (!course) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        const module = course.modules.id(moduleId);
        if (!module) {
            return NextResponse.json({ message: 'Module not found' }, { status: 404 });
        }

        // Determine the order for the new lesson
        const newOrder = module.lessons.length > 0 ? Math.max(...module.lessons.map((l: { order: number }) => l.order)) + 1 : 1;

        const newLesson = {
            _id: new mongoose.Types.ObjectId(), // Generate a new ObjectId for the lesson
            title,
            description,
            content,
            contentType,
            order: newOrder,
            duration,
            isPublished,
            mediaUrl: contentType === 'video' || contentType === 'audio' ? mediaUrl : undefined, // Only include mediaUrl if relevant
        };

        module.lessons.push(newLesson);
        await course.save();

        return NextResponse.json(newLesson, { status: 201 });
    } catch (error) {
        console.error('[API_ADMIN_LESSONS_POST]', error);
        // Provide more specific error message if possible (e.g., validation error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to add lesson';
        return NextResponse.json({ message: errorMessage, error }, { status: 500 });
    }
}
