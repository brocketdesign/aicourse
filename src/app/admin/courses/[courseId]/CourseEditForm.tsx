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
    _id: string;
    // Add any other fields returned by the API but not in the basic Course type
}

export function CourseEditForm({ courseId }: CourseEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Fetch course data on component mount
  useEffect(() => {
    const fetchCourse = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/courses/${courseId}`);
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Course not found.");
            router.push("/admin/courses"); // Redirect if not found
          } else {
            throw new Error(`Failed to fetch course data (${response.status})`);
          }
          return; // Stop execution if fetch failed
        }
        const data: FetchedCourse = await response.json(); // Use FetchedCourse type

        // Convert price from cents to dollars for the form
        const formData = {
          ...data,
          price: data.price / 100,
          coverImage: data.coverImage || "", // Ensure coverImage is not null/undefined
          level: data.level || "", // Ensure level is not null/undefined
        };

        form.reset(formData); // Populate form with fetched data
        toast.success("Course data loaded.");
      } catch (error: any) {
        console.error("Fetch error:", error);
        toast.error(error.message || "Failed to load course data.");
        // Optionally redirect or show error message
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, form, router]); // Added router to dependencies

  // Handle form submission
  async function onSubmit(values: CourseEditFormValues) {
    setIsSubmitting(true);
    const loadingToast = toast.loading("Updating course...");

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values), // Price is already in dollars here, API will convert back
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update course");
      }

      toast.dismiss(loadingToast);
      toast.success("Course updated successfully!");
      router.push("/admin/courses"); // Redirect back to the list
      router.refresh(); // Refresh server components
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.dismiss(loadingToast);
      toast.error(`Update failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
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
