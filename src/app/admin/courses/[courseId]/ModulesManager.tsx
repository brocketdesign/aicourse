// src/app/admin/courses/[courseId]/ModulesManager.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link'; // Import Link
import { useParams } from 'next/navigation';
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
  DialogClose, // Import DialogClose
} from "@/components/ui/dialog";
import { Trash2, Edit, PlusCircle, BookOpen } from 'lucide-react'; // Add BookOpen icon

interface ModulesManagerProps {
  courseId: string;
}

// Define the Module type based on your schema
interface Module {
  _id: string;
  title: string;
  description: string;
  order: number;
  lessons?: Lesson[]; // Add lessons field
  isPublished?: boolean; // Add isPublished field
}

interface Lesson {
  _id: string;
  title: string;
  content: string;
}

export function ModulesManager({ courseId }: ModulesManagerProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for Add/Edit Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<Partial<Module> | null>(null); // For editing or adding
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchModules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/modules`);
      if (!response.ok) {
        throw new Error('Failed to fetch modules');
      }
      const data: Module[] = await response.json();
      // Sort modules by order before setting state
      data.sort((a: Module, b: Module) => a.order - b.order);
      setModules(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError((err as Error).message || 'An unknown error occurred');
      toast.error("Failed to load modules.");
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchModules();
    }
  }, [courseId, fetchModules]);

  const handleAddModule = () => {
    setCurrentModule({}); // Start with an empty object for a new module
    setIsDialogOpen(true);
  };

  const handleEditModule = (module: Module) => {
    setCurrentModule(module);
    setIsDialogOpen(true);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module?')) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete module');
      }
      toast.success("Module deleted successfully!");
      fetchModules(); // Refresh the list
    } catch (err) {
      console.error("Delete error:", err);
      toast.error((err as Error).message || "Failed to delete module.");
    }
  };

  const handleDialogSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const isEditing = currentModule && currentModule._id;
    const url = isEditing
      ? `/api/admin/courses/${courseId}/modules/${currentModule._id}`
      : `/api/admin/courses/${courseId}/modules`;
    const method = isEditing ? 'PUT' : 'POST';

    const formData = new FormData(event.currentTarget);
    const moduleData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moduleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'add'} module`);
      }

      toast.success(`Module ${isEditing ? 'updated' : 'added'} successfully!`);
      setIsDialogOpen(false);
      setCurrentModule(null);
      fetchModules(); // Refresh the list
    } catch (err) {
      console.error("Submit error:", err);
      toast.error((err as Error).message || `Failed to ${isEditing ? 'update' : 'add'} module.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <p>Loading modules...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Course Modules</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddModule}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Module
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{currentModule?._id ? 'Edit Module' : 'Add New Module'}</DialogTitle>
              <DialogDescription>
                {currentModule?._id ? 'Make changes to the module.' : 'Add a new module to the course.'} Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleDialogSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="title" className="text-right">Title</label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={currentModule?.title || ''}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="description" className="text-right">Description</label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={currentModule?.description || ''}
                  className="col-span-3"
                  required
                />
              </div>
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
            <TableHead>Description</TableHead>
            <TableHead>Content</TableHead>
            <TableHead className="text-right w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.length > 0 ? (
            modules.map((module) => (
              <TableRow key={module._id}>
                <TableCell>{module.order}</TableCell>
                <TableCell className="font-medium">{module.title}</TableCell>
                <TableCell>{module.description}</TableCell>
                <TableCell>
                  <Link href={`/admin/courses/${courseId}/modules/${module._id}/lessons`} passHref>
                    <Button variant="outline" size="sm">
                      <BookOpen className="mr-2 h-4 w-4" /> Manage Content
                    </Button>
                  </Link>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleEditModule(module)} className="mr-2">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteModule(module._id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">No modules found. Consider adding one to get started.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
