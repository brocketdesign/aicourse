"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Course } from "../columns"; // Reuse type if appropriate, or define specific one

// Define the form schema using Zod
const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  price: z.coerce.number().positive({
    message: "Price must be a positive number.",
  }).transform(val => parseFloat(val.toFixed(2))), // Ensure price is treated as float with 2 decimals
  coverImage: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  level: z.string().optional(), // Add other fields as needed
  isPublished: z.boolean().default(false),
  // TODO: Add fields for curriculum/modules if managing here
});

type CourseEditFormValues = z.infer<typeof formSchema>;

interface CourseEditFormProps {
  courseId: string;
}

// Define a more specific type for the fetched course data, including _id
interface FetchedCourse extends Course {
  _id: string; // Ensure _id is part of the type
  authors: string[]; // Assuming authors are an array of strings (IDs) for the form
  modules: any[]; // Define more specifically if possible, or use a relevant interface
}

export function CourseEditForm({ courseId }: CourseEditFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Added to fix runtime error
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  // Explicitly type the form state
  const form = useForm<CourseEditFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { // Initialize with empty or default values
      title: "",
      description: "",
      price: 0,
      coverImage: "",
      level: "",
      isPublished: false,
    },
  });

  useEffect(() => {
    if (courseId && courseId !== 'new') {
      const fetchCourse = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/admin/courses/${courseId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch course data');
          }
          // Explicitly type the fetched data
          const data: FetchedCourse = await response.json();
          // Transform price from cents to dollars for the form
          const formData = {
            ...data,
            price: data.price ? data.price / 100 : 0, // Convert cents to dollars
            // Ensure other fields match form schema, provide defaults if necessary
            title: data.title || '',
            description: data.description || '',
            coverImage: data.coverImage || '',
            level: data.level || 'beginner',
            isPublished: data.isPublished || false,
          };
          form.reset(formData);
        } catch (err) {
          // Type the error
          setError((err as Error).message);
          toast.error(`Error fetching course: ${(err as Error).message}`);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCourse();
    } else {
      setIsLoading(false);
      // Initialize form with default values for a new course
      form.reset({
        title: "",
        description: "",
        price: 0,
        coverImage: "",
        level: "beginner",
        isPublished: false,
      });
    }
  }, [courseId, form]);

  // Explicitly type the onSubmit function's data parameter
  async function onSubmit(data: CourseEditFormValues) {
    setIsSubmitting(true);
    const loadingToast = toast.loading(courseId === 'new' ? "Creating course..." : "Updating course...");

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: courseId === 'new' ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), // Price is already in dollars here, API will convert back
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update course");
      }

      toast.dismiss(loadingToast);
      toast.success(courseId === 'new' ? "Course created successfully!" : "Course updated successfully!");
      router.push('/admin/courses'); // Redirect to courses list
      router.refresh(); // Refresh page to reflect changes
    } catch (err) {
      // Type the error
      setError((err as Error).message);
      // Display more specific error from backend if available
      const apiError = err instanceof Error ? (err as any).response?.data?.message || (err as any).response?.data?.error : 'An unexpected error occurred';
      toast.error(courseId === 'new' ? `Failed to create course: ${apiError}` : `Failed to update course: ${apiError}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading && courseId !== 'new') {
    return <p>Loading course details...</p>; // Or a spinner component
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. AI Monetization Masterclass" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>
                The main title of your course.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your course..."
                  className="resize-none"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (USD)</FormLabel>
              <FormControl>
                {/* Use type="number" with step for better UX */}
                <Input type="number" step="0.01" placeholder="e.g. 199.00" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>
                Set the price for your course in US Dollars.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="coverImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>
                URL of the image to display for the course.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Level</FormLabel>
              <FormControl>
                 {/* TODO: Consider using a Select component here */}
                <Input placeholder="e.g. Beginner, Intermediate, Advanced" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isPublished"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Publish Course
                </FormLabel>
                <FormDescription>
                  Make this course visible and available for purchase.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* TODO: Add section for managing course content/modules */}

        <Button type="submit" disabled={isSubmitting || isLoading}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
