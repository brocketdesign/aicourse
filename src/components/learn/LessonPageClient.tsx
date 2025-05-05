'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown'; // For rendering markdown content
import rehypeRaw from 'rehype-raw'; // To handle HTML in markdown
import Link from 'next/link'; // Import Link

// Define the type for a single lesson (adjust based on your Lesson model)
interface Lesson {
  _id: string;
  title: string;
  content: string; // Assuming markdown/HTML content
  videoUrl?: string;
  // Add other fields like order, module ID, etc. if needed
}

// Define the type for the data fetched from the API
interface LessonPageData {
  lesson: Lesson;
  isCompleted: boolean;
  nextLessonId?: string;
  prevLessonId?: string;
}

export default function LessonPageClient() {
  const params = useParams();
  const router = useRouter();
  const { slug, lessonId } = params as { slug: string; lessonId: string };

  const [lessonData, setLessonData] = useState<LessonPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLessonData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Assume an API endpoint exists to fetch lesson details and completion status
      const response = await fetch(`/api/courses/${slug}/lessons/${lessonId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Lesson not found.');
        }
        if (response.status === 403) {
          throw new Error('You are not enrolled in this course.');
        }
        throw new Error('Failed to load lesson data.');
      }
      const data: LessonPageData = await response.json();
      setLessonData(data);
    } catch (err: any) {
      console.error("Error fetching lesson:", err);
      setError(err.message || 'Could not load the lesson.');
      toast.error(err.message || 'Could not load the lesson.');
    } finally {
      setIsLoading(false);
    }
  }, [slug, lessonId]);

  useEffect(() => {
    if (slug && lessonId) {
      fetchLessonData();
    }
  }, [slug, lessonId, fetchLessonData]);

  const handleMarkComplete = async () => {
    if (!lessonData || isUpdating) return;

    setIsUpdating(true);
    const currentlyCompleted = lessonData.isCompleted;

    try {
      const response = await fetch(`/api/courses/${slug}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update progress.';
        try {
          // Attempt to parse error details from the response body
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          } else if (response.statusText) {
            errorMessage = `Failed to update progress: ${response.statusText}`;
          }
        } catch (parseError) {
          // Ignore if response body is not JSON or empty
          console.error("Could not parse error response:", parseError);
          if (response.statusText) {
            errorMessage = `Failed to update progress: ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }

      // Update local state optimistically or based on response
      setLessonData(prev => prev ? { ...prev, isCompleted: !currentlyCompleted } : null);
      toast.success(`Lesson marked as ${!currentlyCompleted ? 'complete' : 'incomplete'}.`);

      // Optional: Automatically navigate to the next lesson upon completion
      if (!currentlyCompleted && lessonData.nextLessonId) {
         // Small delay before navigating
         setTimeout(() => {
           router.push(`/learn/${slug}/${lessonData.nextLessonId}`);
         }, 500);
      }

    } catch (error: any) { // Catch the specific error
      console.error('Failed to update progress:', error);
      // Use the error message thrown above or a default
      toast.error(error?.message || "An unexpected error occurred while updating progress.");
      // Optionally revert optimistic update here if needed
      // setLessonData(prev => prev ? { ...prev, isCompleted: currentlyCompleted } : null);
    } finally {
      setIsUpdating(false);
    }
  };

  const navigateLesson = (targetLessonId: string | undefined) => {
    if (targetLessonId) {
      router.push(`/learn/${slug}/${targetLessonId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-3 text-lg text-gray-600">Loading lesson...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
        <div className="mt-4">
          <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:underline">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!lessonData) {
    return <div className="text-center text-gray-500">Lesson data could not be loaded.</div>; // Should ideally not happen if error handling is correct
  }

  const { lesson, isCompleted, prevLessonId, nextLessonId } = lessonData;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Lesson Header */}
      <div className="mb-6 border-b pb-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{lesson.title}</h1>
        {/* Optional: Add breadcrumbs or module title here */}
      </div>

      {/* Lesson Content */}
      <article className="prose lg:prose-xl max-w-none mb-8">
        {lesson.videoUrl && (
          <div className="aspect-video mb-6 rounded-lg overflow-hidden shadow-md">
            {/* Basic video embed - consider using a dedicated player component */}
            <iframe
              src={lesson.videoUrl} // Ensure this URL is embeddable (e.g., YouTube, Vimeo)
              title={lesson.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        )}
        {/* Render markdown content */}
        <ReactMarkdown rehypePlugins={[rehypeRaw]}>{lesson.content}</ReactMarkdown>
      </article>

      {/* Actions & Navigation */}
      <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Mark Complete Button */}
        <button
          onClick={handleMarkComplete}
          disabled={isUpdating}
          className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white transition-colors disabled:opacity-70 ${isCompleted
              ? 'bg-gray-500 hover:bg-gray-600'
              : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {isUpdating ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-5 w-5" />
          )}
          {isUpdating ? 'Updating...' : (isCompleted ? 'Mark as Incomplete' : 'Mark as Complete')}
        </button>

        {/* Lesson Navigation */}
        <div className="flex gap-3">
          <button
            onClick={() => navigateLesson(prevLessonId)}
            disabled={!prevLessonId}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </button>
          <button
            onClick={() => navigateLesson(nextLessonId)}
            disabled={!nextLessonId}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
