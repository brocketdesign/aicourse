// src/app/api/admin/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/route.ts
import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb';
import Course from '@/models/Course';
import mongoose from 'mongoose';

// Helper function to find a lesson within a course/module
async function findLesson(courseId: string, moduleId: string, lessonId: string) {
    await connect();
    const course = await Course.findById(courseId);
    if (!course) {
        return { course: null, module: null, lesson: null, error: 'Course not found', status: 404 };
    }

    const module = course.modules.id(moduleId);
    if (!module) {
        return { course, module: null, lesson: null, error: 'Module not found', status: 404 };
    }

    const lesson = module.lessons.id(lessonId);
    if (!lesson) {
        return { course, module, lesson: null, error: 'Lesson not found', status: 404 };
    }

    return { course, module, lesson, error: null, status: 200 };
}


// GET a specific lesson
export async function GET(request: Request, { params }: { params: { courseId: string, moduleId: string, lessonId: string } }) {
    const { courseId, moduleId, lessonId } = params;

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(moduleId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
        return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    try {
        const { lesson, error, status } = await findLesson(courseId, moduleId, lessonId);

        if (error) {
            return NextResponse.json({ message: error }, { status });
        }

        return NextResponse.json(lesson);
    } catch (error) {
        console.error('[API_ADMIN_LESSON_GET]', error);
        return NextResponse.json({ message: 'Failed to fetch lesson', error }, { status: 500 });
    }
}

// PUT (update) a specific lesson
export async function PUT(request: Request, { params }: { params: { courseId: string, moduleId: string, lessonId: string } }) {
    const { courseId, moduleId, lessonId } = params;

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(moduleId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
        return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    try {
        const body = await request.json();
        // Destructure all possible fields to update
        const { title, description, content, contentType, order, duration, isPublished, mediaUrl } = body;

        // Validate contentType if provided
        if (contentType) {
            const validContentTypes = ['text', 'video', 'audio', 'quiz', 'code', 'chat'];
            if (!validContentTypes.includes(contentType)) {
                return NextResponse.json({ message: `Invalid contentType: ${contentType}` }, { status: 400 });
            }
        }

        const { course, lesson, error, status } = await findLesson(courseId, moduleId, lessonId);

        if (error || !course || !lesson) {
            return NextResponse.json({ message: error || 'Lesson or Course not found' }, { status: status || 404 });
        }

        // Update lesson fields selectively
        if (title !== undefined) lesson.title = title;
        if (description !== undefined) lesson.description = description;
        if (content !== undefined) lesson.content = content;
        if (contentType !== undefined) lesson.contentType = contentType;
        if (order !== undefined) lesson.order = order;
        if (duration !== undefined) lesson.duration = duration;
        if (isPublished !== undefined) lesson.isPublished = isPublished;
        // Only update mediaUrl if contentType is video or audio
        if ((contentType === 'video' || contentType === 'audio' || lesson.contentType === 'video' || lesson.contentType === 'audio') && mediaUrl !== undefined) {
            lesson.mediaUrl = mediaUrl;
        } else if (contentType && contentType !== 'video' && contentType !== 'audio') {
            // Clear mediaUrl if content type changes away from video/audio
            lesson.mediaUrl = undefined;
        }

        await course.save();

        return NextResponse.json(lesson);
    } catch (error) {
        console.error('[API_ADMIN_LESSON_PUT]', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update lesson';
        return NextResponse.json({ message: errorMessage, error }, { status: 500 });
    }
}

// DELETE a specific lesson
export async function DELETE(request: Request, { params }: { params: { courseId: string, moduleId: string, lessonId: string } }) {
    const { courseId, moduleId, lessonId } = params;

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(moduleId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
        return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    try {
        const { course, module, lesson, error, status } = await findLesson(courseId, moduleId, lessonId);

        if (error || !course || !module || !lesson) {
            return NextResponse.json({ message: error || 'Lesson, Module or Course not found' }, { status: status || 404 });
        }

        // Use Mongoose's pull method for subdocuments
        module.lessons.pull({ _id: lessonId });

        await course.save();

        // Optional: Re-order remaining lessons if necessary
        // module.lessons.sort((a, b) => a.order - b.order).forEach((l, index) => l.order = index + 1);
        // await course.save();

        return NextResponse.json({ message: 'Lesson deleted successfully' });
    } catch (error) {
        console.error('[API_ADMIN_LESSON_DELETE]', error);
        return NextResponse.json({ message: 'Failed to delete lesson', error }, { status: 500 });
    }
}
