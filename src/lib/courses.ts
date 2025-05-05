import { connect } from '@/lib/mongodb'; // Import connect function
import Course from '@/models/Course'; // Import the Course model
import { notFound } from 'next/navigation';

// Simulate fetching course data by slug
export async function getCourseBySlug(slug: string) {
  await connect(); // Ensure database connection

  // Find the course by slug in the database
  // Use lean() for performance as we don't need Mongoose documents features here
  const course = await Course.findOne({ slug }).lean(); 

  if (!course) {
    notFound(); // Trigger 404 page if course not found
  }
  
  // Optional: Check if Stripe Price ID exists or is valid
  if (!course.stripePriceId || course.stripePriceId.startsWith('price_placeholder')) {
    console.warn(`Missing or placeholder Stripe Price ID for course: ${slug}`);
    // Depending on requirements, you might want to handle this differently,
    // e.g., prevent enrollment if the price ID is missing.
  }

  // Convert ObjectId fields to strings if necessary for client-side usage
  // (lean() might handle this, but explicit conversion is safer)
  // Example: course._id = course._id.toString(); 
  //          course.modules.forEach(mod => mod._id = mod._id.toString()); etc.
  // For now, assume the structure returned by lean() is sufficient.

  return course;
}

// Function to get all course slugs (for generateStaticParams)
export async function getAllCourseSlugs() {
  await connect(); // Ensure database connection
  
  // Fetch only the 'slug' field for all courses
  const courses = await Course.find({}, { slug: 1, _id: 0 }).lean(); 
  
  // Map the results to the required format { slug: string }
  return courses.map(course => ({ slug: course.slug }));
}
