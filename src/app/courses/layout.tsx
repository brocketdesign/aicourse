import { Suspense } from "react";

export default function CoursesLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<div className="container mx-auto py-10">Loading course content...</div>}>
        {children}
      </Suspense>
    </div>
  );
}
