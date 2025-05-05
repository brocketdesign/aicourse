'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpen, CheckCircle, Lock } from 'lucide-react';
import { useEffect } from 'react';

// Update interfaces to match the reference-based structure
interface Lesson {
  _id: string;
  title: string;
}

interface Module {
  _id: string;
  title: string;
  description?: string;
  order?: number;
  lessons: Lesson[];
}

interface Course {
  _id: string;
  slug: string;
  title: string;
  modules: Module[];
}

interface CourseSidebarProps {
  course: Course;
  completedLessonIds: string[];
  isEnrolled: boolean;
}

export default function CourseSidebar({ course, completedLessonIds, isEnrolled }: CourseSidebarProps) {
  const params = useParams();
  const currentLessonId = params.lessonId as string;
  const courseSlug = params.slug as string;
  
  // Debug logging to check data coming into the component
  useEffect(() => {
    console.log('CourseSidebar data:', { 
      courseTitle: course.title,
      courseId: course._id,
      moduleCount: course.modules?.length || 0,
      modulesData: course.modules,
      completedLessons: completedLessonIds.length
    });
  }, [course, completedLessonIds]);

  // Ensure course and modules exist
  if (!course || !course.modules) {
    console.error('Course or modules missing in CourseSidebar:', course);
    return (
      <aside className="w-full md:w-80 lg:w-96 h-full border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Course Content</h2>
        </div>
        <div className="p-4">
          <p className="text-gray-500">Unable to load course content.</p>
        </div>
      </aside>
    );
  }

  // Sort modules by order if available
  const sortedModules = [...course.modules].sort((a, b) => 
    (a.order !== undefined && b.order !== undefined) ? a.order - b.order : 0
  );

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full border-r bg-gray-50 flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold truncate" title={course.title}>{course.title}</h2>
        {isEnrolled && (
          <p className="text-sm text-gray-500 mt-1">
            {completedLessonIds.length} lessons completed
          </p>
        )}
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {sortedModules.length > 0 ? (
          sortedModules.map((module, moduleIndex) => {
            // Ensure module has lessons array
            const moduleLessons = Array.isArray(module.lessons) ? module.lessons : [];
            
            // Sort lessons by order if needed (would need to update Module interface)
            const sortedLessons = [...moduleLessons];
            
            return (
              <div key={module._id || `module-${moduleIndex}`}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                  Module {moduleIndex + 1}: {module.title}
                </h3>
                <ul className="space-y-1">
                  {sortedLessons.length > 0 ? (
                    sortedLessons.map((lesson, lessonIndex) => {
                      // Ensure lesson has an _id
                      const lessonId = lesson._id || `lesson-${moduleIndex}-${lessonIndex}`;
                      const isCompleted = completedLessonIds.includes(lessonId);
                      const isActive = lessonId === currentLessonId;

                      return (
                        <li key={lessonId}>
                          <Link
                            href={isEnrolled ? `/learn/${courseSlug}/${lessonId}` : '#'}
                            className={`flex items-center px-3 py-2.5 rounded-md text-sm transition-colors ${
                              isActive
                                ? 'bg-blue-100 text-blue-700 font-medium'
                                : isEnrolled
                                  ? 'text-gray-700 hover:bg-gray-100'
                                  : 'text-gray-400 cursor-not-allowed'
                              } ${isCompleted && isEnrolled ? 'text-gray-500' : ''}`
                            }
                            aria-disabled={!isEnrolled}
                            onClick={(e) => !isEnrolled && e.preventDefault()}
                          >
                            {isEnrolled ? (
                              isCompleted ? (
                                <CheckCircle className="w-4 h-4 mr-3 text-green-500 flex-shrink-0" />
                              ) : (
                                <BookOpen className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                              )
                            ) : (
                              <Lock className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                            )}
                            <span className={`flex-1 truncate ${isCompleted && isEnrolled ? 'line-through' : ''}`}>
                              {lesson.title}
                            </span>
                          </Link>
                        </li>
                      );
                    })
                  ) : (
                    <li className="px-3 py-2 text-sm text-gray-400 italic">No lessons in this module.</li>
                  )}
                </ul>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 px-3">No modules available for this course yet.</p>
        )}
      </nav>
      
      <div className="p-4 border-t">
        <Link 
          href="/dashboard"
          className="block text-center py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </aside>
  );
}
