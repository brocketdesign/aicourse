'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Trash2, Edit, PlusCircle, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

// Define the Lesson type based on your schema
interface Lesson {
  _id: string;
  title: string;
  order: number;
  isPublished?: boolean;
}

interface LessonsManagerProps {
  courseId: string;
  moduleId: string;
  moduleTitle: string;
  onClose: () => void;
}

// Define a more specific type for the fetched lesson data
interface FetchedLesson extends Lesson {}

export function LessonsManager({ courseId, moduleId, moduleTitle, onClose }: LessonsManagerProps) {
  const [lessons, setLessons] = useState<FetchedLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Partial<FetchedLesson> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchLessons = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons`);
      if (!response.ok) {
        throw new Error("Failed to fetch lessons");
      }
      const data: FetchedLesson[] = await response.json();
      setLessons(data.sort((a, b) => a.order - b.order));
    } catch (err) {
      setError((err as Error).message);
      toast.error(`Error fetching lessons: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, moduleId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleAddLesson = async (newLessonData: Partial<FetchedLesson>) => {
    const loadingToast = toast.loading("Adding lesson...");
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLessonData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add lesson");
      }
      toast.dismiss(loadingToast);
      toast.success("Lesson added successfully!");
      fetchLessons();
      setIsFormOpen(false);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(`Failed to add lesson: ${(err as Error).message}`);
    }
  };

  const handleEditLessonAction = async (lessonId: string, updatedLessonData: Partial<FetchedLesson>) => {
    const loadingToast = toast.loading("Updating lesson...");
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedLessonData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update lesson");
      }
      toast.dismiss(loadingToast);
      toast.success("Lesson updated successfully!");
      fetchLessons();
      setIsFormOpen(false);
      setCurrentLesson(null);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(`Failed to update lesson: ${(err as Error).message}`);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }
    const loadingToast = toast.loading("Deleting lesson...");
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete lesson');
      }
      toast.dismiss(loadingToast);
      toast.success("Lesson deleted successfully!");
      fetchLessons();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(`Failed to delete lesson: ${(err as Error).message}`);
    }
  };

  const handleEditLesson = (lesson: FetchedLesson) => {
    setCurrentLesson(lesson);
    setIsFormOpen(true);
  };

  if (isLoading) return <p>Loading lessons...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Lessons for: {moduleTitle}</DialogTitle>
          <DialogDescription>
            Add, edit, or remove lessons for this module. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          <Button onClick={() => { setCurrentLesson(null); setIsFormOpen(true); }} className="mb-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Lesson
          </Button>
        </div>

        {isFormOpen && (
          <LessonForm
            initialData={currentLesson as Partial<FetchedLesson> | null}
            onSave={currentLesson ? (data) => handleEditLessonAction(currentLesson._id!, data) : handleAddLesson}
            onCancel={() => { setIsFormOpen(false); setCurrentLesson(null); }}
          />
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.length > 0 ? (
              lessons.map((lesson) => (
                <TableRow key={lesson._id}>
                  <TableCell>{lesson.order}</TableCell>
                  <TableCell className="font-medium">{lesson.title}</TableCell>
                  <TableCell>
                    <Badge variant={lesson.isPublished ? "default" : "secondary"}>
                      {lesson.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild className="mr-2">
                      <Link href={`/admin/courses/${courseId}/modules/${moduleId}/lessons/${lesson._id}/edit`}>
                        <ListChecks className="h-4 w-4 mr-1" /> Edit Content
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditLesson(lesson)} className="mr-2">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteLesson(lesson._id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">No lessons found in this module. Consider adding one.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
