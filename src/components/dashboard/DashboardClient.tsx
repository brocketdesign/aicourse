"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, BookOpen, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// Define the type for an enrolled course with progress
interface EnrolledCourse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  coverImage?: string; // Updated to use coverImage
  progress: number; // Percentage
  completedLessonsCount: number;
  totalLessonsCount: number;
}

export default function DashboardClient() {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/users/me/enrolled-courses');
        if (!response.ok) {
          throw new Error('Failed to fetch enrolled courses');
        }
        const data = await response.json();
        setEnrolledCourses(data);
      } catch (err) {
        console.error("Error fetching enrolled courses:", err);
        setError('Could not load your courses. Please try again later.');
        toast.error('Could not load your courses.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Courses</h1>

      {isLoading && (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="ml-3 text-lg text-gray-600">Loading your courses...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {!isLoading && !error && enrolledCourses.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-lg border">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Courses Yet</h2>
          <p className="text-gray-500 mb-6">You haven't enrolled in any courses.</p>
          <Link href="/courses" className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
            Explore Courses
          </Link>
        </div>
      )}

      {!isLoading && !error && enrolledCourses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course) => (
            <Link key={course._id} href={`/courses/${course.slug}`} className="group block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100">
              <div className="relative h-48 w-full">
                <Image
                  src={course.coverImage || '/placeholder-course.jpg'} // Use coverImage instead of imageUrl
                  alt={course.title}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold mb-2 truncate group-hover:text-blue-600 transition-colors">{course.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{course.completedLessonsCount}/{course.totalLessonsCount} Lessons</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-xs font-medium text-blue-700 mt-1">{course.progress}% Complete</div>
                </div>

                <button className="w-full mt-3 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 group-hover:bg-blue-700 transition-colors">
                  {course.progress === 100 ? (
                     <>
                       <CheckCircle className="mr-2 h-4 w-4" /> Course Completed!
                     </>
                  ) : course.progress > 0 ? 'Continue Learning' : 'Start Course'}
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}