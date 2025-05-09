import { NextResponse, NextRequest } from "next/server";
import { connect } from "@/lib/mongodb";
import Course, { ICourse } from "@/models/Course"; // Import ICourse
import { auth } from "@clerk/nextjs/server";
import Module from "@/models/Module"; // Import Module model
import Lesson from "@/models/Lesson"; // Import Lesson model

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
    isPublished: course.isPublished,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    // Add any other fields you want to expose, ensure they are in ICourse
    level: course.level,
    duration: course.duration,
    enrollmentCount: course.enrollmentCount,
    featured: course.featured,
    authors: course.authors.map(author => author.toString()),
    modules: course.modules.map(module => module.toString()), // Or serialize modules if needed
  };
}

// GET handler for fetching all courses (admin)
export async function GET(request: NextRequest) { // Use NextRequest, remove unused 'request' if not using query params
  const authResult = await auth();
  // Add admin check if necessary: (authResult.sessionClaims as any)?.metadata?.role !== 'admin'
  if (!authResult?.userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connect();
    // Explicitly type courses
    const courses: ICourse[] = await Course.find({}).sort({ createdAt: -1 }); // Sort by newest first
    return NextResponse.json(courses.map(serializeCourse));
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    // Type the error
    return NextResponse.json({ message: "Failed to fetch courses", error: (error as Error).message }, { status: 500 });
  }
}

// POST handler for creating a new course
export async function POST(request: NextRequest) {
  const authResult = await auth();
  if (!authResult?.userId || (authResult.sessionClaims as any)?.metadata?.role !== 'admin') {
    return NextResponse.json({ message: "Unauthorized: Admin role required" }, { status: 403 });
  }

  try {
    await connect();
    // Explicitly type body
    const body: Partial<ICourse> = await request.json();

    // Basic validation (add more as needed, or use a library like Zod)
    if (!body.title || !body.description) {
      return NextResponse.json({ message: "Title and description are required" }, { status: 400 });
    }

    // Convert price from dollars to cents if it's part of the creation payload
    if (typeof body.price === 'number') {
      body.price = Math.round(body.price * 100);
    } else if (typeof body.price === 'string') {
      const parsedPrice = parseFloat(body.price);
      if (!isNaN(parsedPrice)) {
        body.price = Math.round(parsedPrice * 100);
      } else {
        // Handle invalid price string, perhaps default to 0 or return error
        body.price = 0; 
      }
    } else {
        body.price = 0; // Default price if not provided or invalid type
    }

    // Create a slug from the title (basic example, consider a more robust slugify function)
    const slug = body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    // Explicitly type newCourse
    const newCourse: ICourse = new Course({
      ...body,
      slug: body.slug || slug, // Use provided slug or generate one
      authors: body.authors || [authResult.userId], // Default author to current admin or an empty array
      modules: [], // Initialize with empty modules
      isPublished: body.isPublished || false, // Default to not published
      // Set defaults for other fields if necessary
      level: body.level || 'beginner',
      duration: body.duration || 0,
      enrollmentCount: 0,
      featured: body.featured || false,
    });

    await newCourse.save();
    return NextResponse.json(serializeCourse(newCourse), { status: 201 });
  } catch (error: any) {
    console.error("Failed to create course:", error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: "Validation failed", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to create course", error: error.message }, { status: 500 });
  }
}
