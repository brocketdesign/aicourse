"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns, Course } from "./columns"; // Assuming columns.tsx is in the same directory

// TODO: Implement actual data fetching and error handling
async function getData(): Promise<Course[]> {
  // Fetch data from your API here.
  try {
    const res = await fetch("/api/admin/courses");
    if (!res.ok) {
      throw new Error(`Failed to fetch courses: ${res.statusText}`);
    }
    const data = await res.json();
    // Ensure the data matches the Course type, potentially transforming it
    return data as Course[];
  } catch (error) {
    console.error("Error fetching courses:", error);
    // Handle the error appropriately in UI, maybe return empty array or throw
    return [];
  }
}

export default function CoursesPage() {
  const [data, setData] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const courses = await getData();
        setData(courses);
      } catch (err: any) {
        setError(err.message || "Failed to load courses.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Courses</h1>
        <Link href="/admin/courses/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Course
          </Button>
        </Link>
      </div>
      {loading && <p>Loading courses...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && (
        <DataTable columns={columns} data={data} filterColumnId="title" filterPlaceholder="Filter courses by title..." />
      )}
    </div>
  );
}
