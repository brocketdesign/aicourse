"use client";

import { BookOpen, Clock } from "lucide-react";

interface CourseModulePreviewProps {
  icon: string;
  title: string;
  description: string;
  lessons: number;
  duration: number; // Duration in minutes
}

const CourseModulePreview: React.FC<CourseModulePreviewProps> = ({ icon, title, description, lessons, duration }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 flex-grow">{title}</h3>
      <p className="text-gray-600 mb-4 flex-grow">{description}</p>
      <div className="flex justify-between text-sm text-gray-500 border-t pt-4 mt-auto">
        <div className="flex items-center">
          <BookOpen className="w-4 h-4 mr-1.5" />
          <span>{lessons} Lessons</span>
        </div>
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1.5" />
          <span>~{duration} min</span>
        </div>
      </div>
    </div>
  );
};

export default CourseModulePreview;