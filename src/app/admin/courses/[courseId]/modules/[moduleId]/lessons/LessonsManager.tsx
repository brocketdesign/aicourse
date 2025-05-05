'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming you might want a description or content field
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
import { Trash2, Edit, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Define the Lesson type
interface Lesson {
  _id: string;
  title: string;
  content?: string; // Optional content field
  order: number;
}

export function LessonsManager() {
  const params = useParams();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for Add/Edit Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Partial<Lesson> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLessons = useCallback(async () => {
    if (!courseId || !moduleId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons`);
      if (!response.ok) {
        throw new Error('Failed to fetch lessons');
      }
      const data = await response.json();
      data.sort((a: Lesson, b: Lesson) => a.order - b.order);
      setLessons(data);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || 'An unknown error occurred');
      toast.error("Failed to load lessons.");
    } finally {
      setIsLoading(false);
    }
  }, [courseId, moduleId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleAddLesson = () => {
    setCurrentLesson({});
    setIsDialogOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setIsDialogOpen(true);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete lesson');
      }
      toast.success("Lesson deleted successfully!");
      fetchLessons(); // Refresh the list
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete lesson.");
    }
  };

  const handleDialogSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const isEditing = currentLesson && currentLesson._id;
    const url = isEditing
      ? `/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${currentLesson._id}`
      : `/api/admin/courses/${courseId}/modules/${moduleId}/lessons`;
    const method = isEditing ? 'PUT' : 'POST';

    const formData = new FormData(event.currentTarget);
    const lessonData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string, // Add content field
      // Handle order if needed
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lessonData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'add'} lesson`);
      }

      toast.success(`Lesson ${isEditing ? 'updated' : 'added'} successfully!`);
      setIsDialogOpen(false);
      setCurrentLesson(null);
      fetchLessons(); // Refresh the list
    } catch (err: any) {
      console.error("Submit error:", err);
      toast.error(err.message || `Failed to ${isEditing ? 'update' : 'add'} lesson.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <p>Loading lessons...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="mt-8">
      <Link href={`/admin/courses/${courseId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Course Modules
      </Link>
      <div className="flex justify-between items-center mb-4">
        {/* TODO: Add breadcrumbs or module title here */}
        <h2 className="text-2xl font-semibold">Manage Lessons</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddLesson}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{currentLesson?._id ? 'Edit Lesson' : 'Add New Lesson'}</DialogTitle>
              <DialogDescription>
                {currentLesson?._id ? 'Make changes to the lesson.' : 'Add a new lesson to this module.'} Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleDialogSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="title" className="text-right">Title</label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={currentLesson?.title || ''}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="content" className="text-right">Content</label>
                <Textarea
                  id="content"
                  name="content"
                  defaultValue={currentLesson?.content || ''}
                  className="col-span-3"
                  placeholder="Lesson content (e.g., text, markdown, video URL)"
                  rows={5}
                />
              </div>
              {/* Add order input if needed */}
              <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                 </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Order</TableHead>
            <TableHead>Title</TableHead>
            {/* Add other relevant columns like Content Preview if desired */}
            <TableHead className="text-right w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lessons.length > 0 ? (
            lessons.map((lesson) => (
              <TableRow key={lesson._id}>
                <TableCell>{lesson.order}</TableCell>
                <TableCell className="font-medium">{lesson.title}</TableCell>
                {/* Add other cells */}
                <TableCell className="text-right">
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
              <TableCell colSpan={3} className="text-center">No lessons found for this module.</TableCell> {/* Adjust colSpan based on columns */}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
