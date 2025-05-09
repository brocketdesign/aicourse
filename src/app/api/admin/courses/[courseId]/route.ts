import { NextResponse, NextRequest } from "next/server";
import { connect } from "@/lib/mongodb";
import Course, { ICourse } from "@/models/Course"; // Import ICourse
import Module, { IModule } from "@/models/Module"; // Import IModule
import Lesson, { ILesson } from "@/models/Lesson"; // Import ILesson
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";

// Helper to serialize lesson for client
// Explicitly type the lesson parameter
function serializeLesson(lesson: ILesson) {
    return {
        _id: lesson._id.toString(),
        title: lesson.title,
        content: lesson.content,
        order: lesson.order,
        module: lesson.module.toString(),
        contentType: (lesson as any).contentType, // Assuming these exist on your ILesson
        mediaUrl: (lesson as any).mediaUrl,
        duration: (lesson as any).duration,
        isPublished: (lesson as any).isPublished,
        createdAt: lesson.createdAt.toISOString(),
        updatedAt: lesson.updatedAt.toISOString(),
    };
}

// Helper to serialize module for client
// Explicitly type the module parameter
function serializeModule(moduleDoc: IModule) {
    return {
        _id: moduleDoc._id.toString(),
        title: moduleDoc.title,
        description: moduleDoc.description,
        order: moduleDoc.order,
        course: moduleDoc.course ? moduleDoc.course.toString() : null,
        lessons: moduleDoc.lessons && Array.isArray(moduleDoc.lessons)
            ? moduleDoc.lessons.map(lesson => serializeLesson(lesson as ILesson))
            : [],
        isPublished: (moduleDoc as any).isPublished,
        createdAt: moduleDoc.createdAt ? moduleDoc.createdAt.toISOString() : null,
        updatedAt: moduleDoc.updatedAt ? moduleDoc.updatedAt.toISOString() : null,
    };
}

// Helper to serialize course for client (convert ObjectId/Date to string)
// Explicitly type the course parameter
function serializeCourse(course: ICourse) {
  return {
    _id: course._id.toString(),
    title: course.title,
    slug: course.slug,
    description: course.description,
    coverImage: course.coverImage,
    price: course.price, // Price is already a number (cents)
    stripePriceId: course.stripePriceId,
    stripeProductId: course.stripeProductId,
    authors: course.authors.map((author) => author.toString()),
    modules: course.modules.map(module => serializeModule(module as IModule)), // Ensure modules are populated and serialized
    isPublished: course.isPublished,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    prerequisites: course.prerequisites,
    level: course.level,
    duration: course.duration,
    featured: course.featured,
    enrollmentCount: course.enrollmentCount,
  };
}

// GET handler for fetching a single course
export async function GET(
  request: NextRequest, // Use NextRequest
  { params }: { params: { courseId: string } }
) {
  console.log(`[API GET /admin/courses/:courseId] Received request for ID: ${params.courseId}`);
  try {
    await connect();
    const { courseId } = params;

    const isValidObjectId = mongoose.Types.ObjectId.isValid(courseId);
    console.log(`[API GET /admin/courses/:courseId] Is ObjectId valid? ${isValidObjectId}`);

    if (!isValidObjectId) {
      console.log(`[API GET /admin/courses/:courseId] Invalid ID format.`);
      return NextResponse.json({ message: "Invalid Course ID" }, { status: 400 });
    }

    console.log(`[API GET /admin/courses/:courseId] Attempting to find course with ID: ${courseId}`);
    // Populate modules, and within modules, populate lessons
    // Explicitly type course
    const course: ICourse | null = await Course.findById(courseId)
      .populate({
        path: 'modules',
        model: Module,
        options: { sort: { order: 1 } },
        populate: {
          path: 'lessons',
          model: Lesson,
          options: { sort: { order: 1 } }
        }
      })
      // .lean(); // lean() can sometimes cause issues with virtuals or methods, remove if causing problems with serialization

    if (!course) {
      console.log(`[API GET /admin/courses/:courseId] Course not found in database for ID: ${courseId}`);
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }
    console.log(`[API GET /admin/courses/:courseId] Found course (before serialization):`, course);
    return NextResponse.json(serializeCourse(course));
  } catch (error) {
    console.error(`[API GET /admin/courses/:courseId] Error fetching course for ID: ${params.courseId}`, error);
    // Type the error
    return NextResponse.json({ message: "Failed to fetch course", error: (error as Error).message }, { status: 500 });
  }
}

// PUT handler for updating a course
export async function PUT(
  request: NextRequest, // Use NextRequest
  { params }: { params: { courseId: string } }
) {
  try {
    await connect();
    const { courseId } = params;
    // Explicitly type body
    const body: Partial<ICourse> = await request.json();

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ message: "Invalid Course ID" }, { status: 400 });
    }

    // Convert price from dollars (received from form) back to cents for storage
    if (typeof body.price === 'number') {
      body.price = Math.round(body.price * 100);
    } else if (typeof body.price === 'string') {
       const parsedPrice = parseFloat(body.price);
       if (!isNaN(parsedPrice)) {
         body.price = Math.round(parsedPrice * 100);
       } else {
         delete body.price; // Remove if not a valid number string
       }
    }

    // Exclude modules and lessons from direct update via this endpoint
    // These should be managed by their own dedicated API routes
    delete (body as any).modules; // Use type assertion if modules/lessons are not on ICourse directly
    delete (body as any).lessons;

    // Explicitly type updatedCourse
    const updatedCourse: ICourse | null = await Course.findByIdAndUpdate(
        courseId,
        { $set: body },
        {
          new: true,
          runValidators: true,
        }
    );

    if (!updatedCourse) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    // Re-fetch with population to return the full updated object for consistency
    // Explicitly type populatedCourse
    const populatedCourse: ICourse | null = await Course.findById(updatedCourse._id)
      .populate({
        path: 'modules',
        model: Module,
        options: { sort: { order: 1 } },
        populate: {
          path: 'lessons',
          model: Lesson,
          options: { sort: { order: 1 } }
        }
      });
    
    if (!populatedCourse) { // Should not happen if updatedCourse was found, but good practice
        return NextResponse.json({ message: "Failed to retrieve populated course after update" }, { status: 500 });
    }

    return NextResponse.json(serializeCourse(populatedCourse));
  } catch (error: any) {
    console.error("Error updating course:", error);
    if (error.name === 'ValidationError') {
        return NextResponse.json({ message: "Validation failed", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to update course", error: error.message }, { status: 500 });
  }
}

// DELETE handler for deleting a course
export async function DELETE(
  request: NextRequest, // Use NextRequest
  { params }: { params: { courseId: string } }
) {
  const authResult = await auth();
  if (!authResult?.userId || (authResult.sessionClaims as any)?.metadata?.role !== 'admin') {
    return NextResponse.json({ message: "Unauthorized: Admin role required" }, { status: 403 });
  }

  console.log(`[API DELETE /admin/courses/:courseId] Received request for ID: ${params.courseId}`);
  try {
    await connect();
    const { courseId } = params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.log(`[API DELETE /admin/courses/:courseId] Invalid ID format.`);
      return NextResponse.json({ message: "Invalid Course ID" }, { status: 400 });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the course to get its modules and lessons
      // Explicitly type courseToDelete
      const courseToDelete: ICourse | null = await Course.findById(courseId).session(session);

      if (!courseToDelete) {
        await session.abortTransaction();
        session.endSession();
        console.log(`[API DELETE /admin/courses/:courseId] Course not found: ${courseId}`);
        return NextResponse.json({ message: "Course not found" }, { status: 404 });
      }

      // Delete all lessons within the modules of the course
      for (const moduleId of courseToDelete.modules) {
        // Explicitly type moduleWithLessons
        const moduleWithLessons: IModule | null = await Module.findById(moduleId).session(session);
        if (moduleWithLessons) {
          await Lesson.deleteMany({ _id: { $in: moduleWithLessons.lessons } }).session(session);
        }
      }

      // Delete all modules of the course
      await Module.deleteMany({ course: courseId }).session(session);

      // Finally, delete the course itself
      await Course.findByIdAndDelete(courseId).session(session);

      await session.commitTransaction();
      session.endSession();

      console.log(`[API DELETE /admin/courses/:courseId] Course and associated data deleted successfully: ${courseId}`);
      return NextResponse.json({ message: "Course and associated data deleted successfully" }, { status: 200 });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error(`[API DELETE /admin/courses/:courseId] Error during transaction for course: ${params.courseId}`, error);
      // Type the error
      return NextResponse.json({ message: "Failed to delete course due to an internal error", error: (error as Error).message }, { status: 500 });
    }

  } catch (error) {
    console.error(`[API DELETE /admin/courses/:courseId] Error deleting course: ${params.courseId}`, error);
    // Type the error
    return NextResponse.json({ message: "Failed to delete course", error: (error as Error).message }, { status: 500 });
  }
}
