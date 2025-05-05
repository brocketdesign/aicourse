"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  enrolledCoursesCount: number;
  lastLogin: string;
  createdAt: string;
}

// Basic Table Component (can be moved to components/ui later)
function UserTable({ users }: { users: UserData[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-foreground/70 border-b border-black/10 dark:border-white/10">
            <th className="pb-3 font-medium">Name</th>
            <th className="pb-3 font-medium">Email</th>
            <th className="pb-3 font-medium">Role</th>
            <th className="pb-3 font-medium">Courses</th>
            <th className="pb-3 font-medium">Last Login</th>
            <th className="pb-3 font-medium">Joined</th>
            <th className="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5 dark:divide-white/5">
          {users.map((user) => (
            <tr key={user.id} className="text-sm hover:bg-foreground/5">
              <td className="py-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center mr-3 font-medium">
                    {user.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <div className="font-medium">{user.name || "-"}</div>
                  </div>
                </div>
              </td>
              <td className="py-3">{user.email || "-"}</td>
              <td className="py-3 capitalize">{user.role || "-"}</td>
              <td className="py-3 text-center">{user.enrolledCoursesCount}</td>
              <td className="py-3">{user.lastLogin || "-"}</td>
              <td className="py-3">{user.createdAt || "-"}</td>
              <td className="py-3 text-right">
                {/* Add action buttons here (e.g., View Details, Edit, Delete) */}
                <button className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50">
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminStudentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  // Add state for search, filters, pagination later

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/students");
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({})); // Try to parse error details
          throw new Error(
            `Failed to fetch users: ${res.statusText} ${errorData.details || ""}`
          );
        }
        const data = await res.json();
        setUsers(data);
      } catch (err: any) {
        console.error("Error fetching students:", err);
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Manage Students</h1>
        <p className="text-foreground/70">View and manage registered users.</p>
      </header>

      {/* TODO: Add Search and Filter controls here */}
      <div className="mb-6 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search students..."
          className="px-3 py-2 border border-black/10 dark:border-white/10 rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm w-64"
          // Add onChange handler for search functionality
        />
        {/* Add filter dropdowns or buttons */}
      </div>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="bg-background rounded-lg border border-black/10 dark:border-white/10 p-6 shadow-sm">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse h-12 bg-foreground/5 rounded"
              ></div>
            ))}
          </div>
        ) : users.length > 0 ? (
          <UserTable users={users} />
        ) : (
          <p className="text-sm text-foreground/70 text-center py-8">
            No students found.
          </p>
        )}
        {/* TODO: Add Pagination controls here */}
      </div>
    </motion.div>
  );
}
