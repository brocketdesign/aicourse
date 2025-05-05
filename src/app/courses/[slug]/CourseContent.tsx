"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Lesson {
  _id: string;
  title: string;
  description: string;
  contentType: "text" | "video" | "audio" | "quiz" | "code" | "chat";
  duration?: number;
  isPublished: boolean;
}

interface Module {
  _id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

interface CourseContentProps {
  modules: Module[];
}

export default function CourseContent({ modules }: CourseContentProps) {
  const [expandedModule, setExpandedModule] = useState<string | null>(
    modules.length > 0 ? modules[0]._id : null
  );

  const totalLessons = modules.reduce(
    (count, module) => count + module.lessons.length,
    0
  );

  const totalDuration = modules.reduce((total, module) => {
    return (
      total +
      module.lessons.reduce((moduleTotal, lesson) => {
        return moduleTotal + (lesson.duration || 0);
      }, 0)
    );
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm mb-4 text-foreground/70">
        <div>{totalLessons} lessons</div>
        <div>{totalDuration} minutes total</div>
      </div>

      {modules.map((module, moduleIndex) => {
        const isExpanded = expandedModule === module._id;

        return (
          <div
            key={module._id}
            className="border border-black/10 dark:border-white/10 rounded-lg overflow-hidden"
          >
            <button
              className={`w-full flex items-center justify-between p-4 text-left ${
                isExpanded
                  ? "bg-foreground/5"
                  : "bg-background hover:bg-foreground/3"
              }`}
              onClick={() =>
                setExpandedModule(isExpanded ? null : module._id)
              }
            >
              <div>
                <h3 className="font-medium">
                  {moduleIndex + 1}. {module.title}
                </h3>
                <p className="text-sm text-foreground/70">
                  {module.lessons.length} lessons
                </p>
              </div>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ul className="divide-y divide-black/5 dark:divide-white/5">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <li
                        key={lesson._id}
                        className="p-4 hover:bg-foreground/3 flex items-center justify-between"
                      >
                        <div className="flex items-start gap-3">
                          {getLessonIcon(lesson.contentType)}
                          <div>
                            <div className="font-medium">
                              {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                            </div>
                            <p className="text-sm text-foreground/70">
                              {lesson.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-foreground/60">
                          {lesson.contentType === "video" && (
                            <span className="bg-foreground/5 px-2 py-1 rounded text-xs">
                              Video
                            </span>
                          )}
                          {lesson.contentType === "audio" && (
                            <span className="bg-foreground/5 px-2 py-1 rounded text-xs">
                              Audio
                            </span>
                          )}
                          {lesson.contentType === "quiz" && (
                            <span className="bg-foreground/5 px-2 py-1 rounded text-xs">
                              Quiz
                            </span>
                          )}
                          {lesson.duration && (
                            <span>{lesson.duration} min</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function getLessonIcon(contentType: string) {
  switch (contentType) {
    case "video":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-500 mt-1"
        >
          <path d="m10 7 5 3-5 3Z" />
          <rect width="20" height="14" x="2" y="5" rx="2" />
        </svg>
      );
    case "audio":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-500 mt-1"
        >
          <path d="M12 6v12" />
          <path d="M6 12h12" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
    case "quiz":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-500 mt-1"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "code":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-500 mt-1"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case "chat":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-500 mt-1"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-500 mt-1"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
          <path d="M10 9H8" />
        </svg>
      );
  }
}