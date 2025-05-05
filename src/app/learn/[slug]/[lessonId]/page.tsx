import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import LessonPageClient from '@/components/learn/LessonPageClient';

// This page component primarily delegates rendering to the client component.
// The layout already handles data fetching for the sidebar and enrollment check.
// The client component will fetch the specific lesson details.

export default async function LessonPage({ params }: { params: Promise<{ slug: string; lessonId: string }> }) {
  const resolvedParams = await params;
  const { userId } = await auth();

  if (!userId) {
    // Redirect to sign-in, preserving the intended destination
    return redirect(`/sign-in?redirect_url=/learn/${resolvedParams.slug}/${resolvedParams.lessonId}`);
  }

  // Basic validation of params (more robust validation might be needed)
  if (!resolvedParams.slug || !resolvedParams.lessonId) {
    console.warn('Missing slug or lessonId in params', resolvedParams);
    return redirect('/dashboard'); // Or a more specific error page
  }

  // The layout (`/learn/[slug]/layout.tsx`) handles the core data fetching
  // (course structure, enrollment check, progress for sidebar).
  // We render the client component which will fetch its own specific lesson data.
  // LessonPageClient uses the useParams hook, so no need to pass props here.
  return <LessonPageClient />;
}
