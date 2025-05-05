import { getCourseBySlug, getAllCourseSlugs } from "@/lib/courses";
import CoursePageClient from "./CoursePageClient";

// Function to generate static paths at build time
export async function generateStaticParams() {
  const slugs = await getAllCourseSlugs();
  return slugs;
}

// The main page component is now async to fetch data
export default async function CoursePage({ params }: { params: { slug: string } }) {
  const course = await getCourseBySlug(params.slug);
  
  // Pass the fetched course data to a client component
  return <CoursePageClient course={course} />;
}