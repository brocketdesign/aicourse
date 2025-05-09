'use client';

import { useEffect, useState, useCallback } from 'react';
import { DataTable } from "@/components/ui/data-table";
import { Course, createColumns } from "./columns";
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

async function getData(): Promise<Course[]> {
  console.log("Fetching courses data...");
  try {
    const res = await fetch('/api/admin/courses');
    if (!res.ok) {
      console.error("Failed to fetch courses: ", res.status, res.statusText);
      const errorBody = await res.text();
      console.error("Error body:", errorBody);
      throw new Error(`Failed to fetch courses: ${res.statusText}`);
    }
    // Explicitly type the data from the API
    const data: any[] = await res.json();
    console.log("Courses data fetched successfully:", data);
    // Ensure _id is present and price is a number
    return data.map((course: any) => ({
      ...course,
      _id: course._id || course.id, // Handle potential id field if serialization changes
      price: typeof course.price === 'number' ? course.price : 0, // Ensure price is a number
      isPublished: typeof course.isPublished === 'boolean' ? course.isPublished : false,
    }));
  } catch (error) {
    console.error("Error in getData:", error);
    // Type the error
    toast.error(`Could not load courses: ${(error as Error).message}. Please try again later.`);
    return []; // Return empty array on error
  }
}

export default function CoursesPage() {
  const [data, setData] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const courses = await getData();
    setData(courses);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = createColumns(fetchData);

  if (loading) {
    return <div>Loading courses...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Manage Courses</h1>
        {/* TODO: Implement the /admin/courses/new page */}
        <Button asChild>
          <Link href="/admin/courses/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Course
          </Link>
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={data}
        filterColumnId="title" // Added filter column ID
        filterPlaceholder="Filter by title..." // Added filter placeholder
      />
    </div>
  );
}
