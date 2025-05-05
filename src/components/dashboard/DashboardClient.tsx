"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  BookOpen, 
  Clock, 
  ChevronRight, 
  GraduationCap,
  BarChart3, 
  BookMarked,
  Award
} from "lucide-react";
import { UserResource } from "@clerk/types";

interface Course {
  _id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  coverImage?: string;
  modules: {
    id: string;
    title: string;
    lessons: string[];
  }[];
  progress?: {
    completed: number;
    total: number;
    percentage: number;
  };
}

interface DashboardClientProps {
  user: UserResource;
  courses: Course[];
  availableCourses?: Course[];
}

export default function DashboardClient({ user, courses, availableCourses = [] }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"courses" | "progress" | "certificates">("courses");

  // Calculate course progress
  const coursesWithProgress = courses.map(course => {
    // In a real app, this would come from the database
    // For now, we're adding mock progress
    return {
      ...course,
      progress: {
        completed: Math.floor(Math.random() * 5), // Random number between 0-4 for completed lessons
        total: course.modules.reduce((acc, module) => acc + module.lessons.length, 0),
        percentage: Math.floor(Math.random() * 100) // Random percentage between 0-100%
      }
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.firstName}</h1>
          <p className="text-blue-100">
            Continue your learning journey or explore new courses.
          </p>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto">
            <button
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === "courses" 
                  ? "border-blue-600 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("courses")}
            >
              My Courses
            </button>
            <button
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === "progress" 
                  ? "border-blue-600 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("progress")}
            >
              Progress
            </button>
            <button
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === "certificates" 
                  ? "border-blue-600 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("certificates")}
            >
              Certificates
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === "courses" && (
          <>
            {/* My Courses Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">My Courses</h2>

              {coursesWithProgress.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <GraduationCap className="w-12 h-12 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
                  <p className="text-gray-600 mb-6">
                    You haven't enrolled in any courses. Explore our available courses to begin your learning journey.
                  </p>
                  <Link 
                    href="/courses/ai-monetization" 
                    className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    Browse Courses
                  </Link>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {coursesWithProgress.map((course) => (
                    <div key={course._id} className="bg-white rounded-lg shadow overflow-hidden">
                      {/* Course Cover Image */}
                      <div className="relative h-40 w-full bg-gray-200">
                        {course.coverImage ? (
                          <Image
                            src={course.coverImage}
                            alt={course.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gradient-to-r from-blue-500 to-purple-600">
                            <BookOpen className="h-12 w-12 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-lg mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {course.subtitle || course.description}
                        </p>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span className="font-medium">
                              {course.progress?.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{ width: `${course.progress?.percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Course Stats */}
                        <div className="flex justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center">
                            <BookOpen className="w-4 h-4 mr-1" />
                            <span>
                              {course.progress?.completed}/{course.progress?.total} lessons
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>
                              {Math.ceil((course.progress?.total || 0) * 0.5)} hrs
                            </span>
                          </div>
                        </div>

                        {/* Continue Button */}
                        <Link
                          href={`/courses/${course.slug}`}
                          className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                        >
                          Continue Learning
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Courses */}
            {availableCourses.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6">Recommended for You</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {availableCourses.map((course) => (
                    <div key={course._id} className="bg-white rounded-lg shadow overflow-hidden">
                      {/* Course Cover Image */}
                      <div className="relative h-40 w-full bg-gray-200">
                        {course.coverImage ? (
                          <Image
                            src={course.coverImage}
                            alt={course.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gradient-to-r from-blue-500 to-purple-600">
                            <BookOpen className="h-12 w-12 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-lg mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {course.subtitle || course.description}
                        </p>

                        {/* Course Stats */}
                        <div className="flex justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center">
                            <BookOpen className="w-4 h-4 mr-1" />
                            <span>
                              {course.modules.reduce((acc, module) => acc + module.lessons.length, 0)} lessons
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>
                              {Math.ceil(course.modules.reduce((acc, module) => acc + module.lessons.length, 0) * 0.5)} hrs
                            </span>
                          </div>
                        </div>

                        {/* Enroll Button */}
                        <Link
                          href={`/courses/${course.slug}`}
                          className="flex items-center justify-center w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded transition-colors"
                        >
                          View Course
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "progress" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">My Learning Progress</h2>
            
            {coursesWithProgress.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No progress data available</h3>
                <p className="text-gray-500">Enroll in courses to track your progress</p>
              </div>
            ) : (
              <div className="space-y-6">
                {coursesWithProgress.map((course) => (
                  <div key={course._id} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">{course.title}</h3>
                    
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Overall Progress</span>
                        <span className="font-medium">{course.progress?.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${course.progress?.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Modules List */}
                    <div className="space-y-3">
                      {course.modules.map((module, index) => (
                        <div key={module.id} className="text-sm">
                          <div className="font-medium text-gray-700">Module {index + 1}: {module.title}</div>
                          <div className="ml-6 text-gray-500 mt-1">
                            {/* In a real app, you'd show actual completion data per module */}
                            {Math.floor(Math.random() * module.lessons.length)}/{module.lessons.length} lessons completed
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "certificates" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">My Certificates</h2>
            
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No certificates yet</h3>
              <p className="text-gray-500 mb-6">Complete a course to earn your certificate</p>
              
              {coursesWithProgress.length > 0 ? (
                <Link 
                  href={`/courses/${coursesWithProgress[0].slug}`}
                  className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Continue Learning
                </Link>
              ) : (
                <Link 
                  href="/courses/ai-monetization"
                  className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Explore Courses
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}