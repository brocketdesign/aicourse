'use client';

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// Define the shape of our data
// Use Zod for validation if needed
export type Course = {
  _id: string; // Changed from id to _id
  title: string;
  price: number; // In cents from API
  isPublished: boolean; // Added isPublished
  createdAt?: string | Date; // Optional, depending on API serialization
  updatedAt?: string | Date; // Optional
};

// Function to handle deletion
const handleDelete = async (courseId: string, refreshData: () => void) => {
  if (!confirm("Are you sure you want to delete this course?")) {
    return;
  }
  try {
    console.log(`Attempting to delete course with ID: ${courseId}`);
    const response = await fetch(`/api/admin/courses/${courseId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      // Type the error data
      const errorData: { message?: string } = await response.json();
      throw new Error(errorData.message || "Failed to delete course");
    }
    toast.success("Course deleted successfully!");
    refreshData(); // Refresh the data table
  } catch (error: any) {
    console.error("Error deleting course:", error);
    toast.error(`Failed to delete course: ${error.message}`);
  }
};

// Factory function to create columns
export const createColumns = (refreshData: () => void): ColumnDef<Course>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    cell: ({ row }) => {
      const priceInCents = parseFloat(row.getValue("price"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(priceInCents / 100); // Convert cents to dollars for display
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "isPublished",
    header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    cell: ({ row }) => {
      const isPublished = row.getValue("isPublished");
      const status = isPublished ? "Published" : "Draft";
      const variant = isPublished ? "default" : "secondary";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const course = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/admin/courses/${course._id}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDelete(course._id, refreshData)} // Pass refreshData
              className="text-red-600 focus:text-red-700 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
