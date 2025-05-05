// src/app/admin/courses/[courseId]/page.tsx
import { CourseEditForm } from "./CourseEditForm";
import { ModulesManager } from "./ModulesManager"; // Import the new ModulesManager component
import { Toaster } from "@/components/ui/sonner"; // Import Toaster for displaying notifications

interface CourseEditPageProps {
  params: {
    courseId: string;
  };
}

export default function CourseEditPage({ params }: CourseEditPageProps) {
  const { courseId } = params;

  // Log when the page component is rendered
  console.log(`[CourseEditPage] Rendering for courseId: ${courseId}`);

  // Basic validation or check if needed, though API and form handle most of it
  if (!courseId) {
    // Handle case where courseId might be missing, though Next.js routing usually prevents this
    console.error("[CourseEditPage] courseId is missing from params.");
    return <p>Invalid course ID.</p>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Edit Course</h1>
      {/* Render the form component, passing the courseId */}
      <CourseEditForm courseId={courseId} />

      {/* Render the ModulesManager component below the form */}
      <ModulesManager />

      {/* Add Toaster here to enable toast notifications from the form and module manager */}
      <Toaster richColors position="top-right" />
    </div>
  );
}
