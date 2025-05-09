"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatData {
  value: number | string;
  change: string;
  positive: boolean;
}

interface AdminStats {
  totalRevenue: StatData;
  activeStudents: StatData;
  totalEnrollments: StatData;
  courseCompletion: StatData;
  churnRate: StatData;
}

interface ChartDataPoint {
  month: string;
  amount?: number;
  count?: number;
}

interface RecentEnrollment {
  id: string;
  name: string;
  email: string;
  course: string;
  date: string;
  amount: number;
}

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
}

function StatsCard({ title, value, change, positive, icon }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-background rounded-lg border border-black/10 dark:border-white/10 p-6 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-foreground/70 mb-1">{title}</p>
          <h4 className="text-2xl font-bold">{value}</h4>
          <div className="flex items-center mt-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                positive
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {positive ? "↑" : "↓"} {change}
            </span>
            <span className="text-xs text-foreground/60 ml-2">vs. last month</span>
          </div>
        </div>
        <div className="p-3 rounded-full bg-foreground/5">{icon}</div>
      </div>
    </motion.div>
  );
}

function SimpleBarChart({
  data,
  valueKey,
  labelKey,
}: {
  data: ChartDataPoint[];
  valueKey: "amount" | "count";
  labelKey: "month";
}) {
  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];
  const validData = safeData.filter((d) => typeof d[valueKey] === "number");
  const max = validData.length > 0 ? Math.max(...validData.map((d) => d[valueKey]!)) : 1;

  return (
    <div className="relative w-full h-40 mt-6">
      <div className="flex items-end justify-between h-32 gap-3">
        {safeData.map((d, i) => (
          <div key={i} className="relative flex flex-col items-center flex-1">
            <div
              className="w-full bg-blue-500 rounded-t relative transition-height duration-500 ease-out"
              style={{
                height: `${((d[valueKey] ?? 0) / max) * 100}%`,
              }}
            >
              <div className="absolute bottom-0 left-0 w-full text-center -mb-6">
                <div className="text-xs font-medium">{d[labelKey]}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [revenueData, setRevenueData] = useState<ChartDataPoint[]>([]); // Ensure default is an empty array
  const [enrollmentData, setEnrollmentData] = useState<ChartDataPoint[]>([]); // Ensure default is an empty array
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, revenueRes, enrollmentRes, recentRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/revenue-chart"),
          fetch("/api/admin/enrollment-chart"),
          fetch("/api/admin/recent-enrollments"),
        ]);

        if (!statsRes.ok) throw new Error(`Failed to fetch stats: ${statsRes.statusText}`);
        if (!revenueRes.ok) throw new Error(`Failed to fetch revenue data: ${revenueRes.statusText}`);
        if (!enrollmentRes.ok) throw new Error(`Failed to fetch enrollment data: ${enrollmentRes.statusText}`);
        if (!recentRes.ok) throw new Error(`Failed to fetch recent enrollments: ${recentRes.statusText}`);

        const statsData = await statsRes.json();
        const revenueChartData = await revenueRes.json();
        const enrollmentChartData = await enrollmentRes.json();
        const recentEnrollmentsData = await recentRes.json();

        setStats(statsData);
        setRevenueData(revenueChartData || []); // Ensure fallback to empty array
        setEnrollmentData(enrollmentChartData || []); // Ensure fallback to empty array
        setRecentEnrollments(recentEnrollmentsData);
      } catch (err) {
        console.error("Error fetching admin dashboard data:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number | string | undefined) => {
    if (amount === undefined) return '-';
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return '-';
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numericAmount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse h-40 bg-foreground/5 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600">Failed to Load Dashboard Data</h2>
        <p className="text-red-400">Error: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-foreground/70">Overview of your course platform</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats ? (
          <>
            <StatsCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue.value)}
              change={stats.totalRevenue.change}
              positive={stats.totalRevenue.positive}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                  <path d="M12 18V6" />
                </svg>
              }
            />
            <StatsCard
              title="Active Students"
              value={stats.activeStudents.value.toString()}
              change={stats.activeStudents.change}
              positive={stats.activeStudents.positive}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
            <StatsCard
              title="Total Enrollments"
              value={stats.totalEnrollments.value.toString()}
              change={stats.totalEnrollments.change}
              positive={stats.totalEnrollments.positive}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-4-4h-2" />
                  <circle cx="16" cy="11" r="4" />
                </svg>
              }
            />
            <StatsCard
              title="Churn Rate"
              value={stats.churnRate.value.toString()}
              change={stats.churnRate.change}
              positive={stats.churnRate.positive}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" x2="4" y1="22" y2="15" />
                </svg>
              }
            />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-background rounded-lg border border-black/10 dark:border-white/10 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Monthly Revenue</h3>
            <div className="text-sm text-foreground/60">Last 5 months</div>
          </div>
          <SimpleBarChart data={revenueData} valueKey="amount" labelKey="month" />
        </div>

        <div className="bg-background rounded-lg border border-black/10 dark:border-white/10 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">New Enrollments</h3>
            <div className="text-sm text-foreground/60">Last 5 months</div>
          </div>
          <SimpleBarChart data={enrollmentData} valueKey="count" labelKey="month" />
        </div>
      </div>

      <div className="bg-background rounded-lg border border-black/10 dark:border-white/10 p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium">Recent Enrollments</h3>
          <Link
            href="/admin/enrollments"
            className="text-sm text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
          >
            View all
          </Link>
        </div>

        {recentEnrollments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-foreground/70 border-b border-black/10 dark:border-white/10">
                  <th className="pb-3 font-medium">Student</th>
                  <th className="pb-3 font-medium">Course</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {recentEnrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="text-sm">
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center mr-3 font-medium">
                          {enrollment.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="font-medium">{enrollment.name || "-"}</div>
                          <div className="text-foreground/60 text-xs">
                            {enrollment.email || "-"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">{enrollment.course || "-"}</td>
                    <td className="py-3">
                      {new Date(enrollment.date + "T00:00:00").toLocaleDateString() || "-"}
                    </td>
                    <td className="py-3 text-right">{formatCurrency(enrollment.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-foreground/70">No recent enrollments found.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/courses/new">
          <div className="bg-background border border-black/10 dark:border-white/10 rounded-lg p-6 shadow-sm hover:border-blue-500 transition-colors group">
            <div className="flex items-center mb-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <h3 className="font-medium">Create New Course</h3>
            </div>
            <p className="text-sm text-foreground/60 mb-2">
              Add a new course with modules and lessons
            </p>
            <span className="text-xs text-blue-500 group-hover:text-blue-600 transition-colors">
              Get started →
            </span>
          </div>
        </Link>

        <Link href="/admin/students">
          <div className="bg-background border border-black/10 dark:border-white/10 rounded-lg p-6 shadow-sm hover:border-blue-500 transition-colors group">
            <div className="flex items-center mb-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-4-4h-2" />
                  <circle cx="16" cy="11" r="4" />
                </svg>
              </div>
              <h3 className="font-medium">Manage Students</h3>
            </div>
            <p className="text-sm text-foreground/60 mb-2">
              View and manage student enrollments
            </p>
            <span className="text-xs text-blue-500 group-hover:text-blue-600 transition-colors">
              View students →
            </span>
          </div>
        </Link>

        <Link href="/admin/revenue">
          <div className="bg-background border border-black/10 dark:border-white/10 rounded-lg p-6 shadow-sm hover:border-blue-500 transition-colors group">
            <div className="flex items-center mb-3">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
              <h3 className="font-medium">View Analytics</h3>
            </div>
            <p className="text-sm text-foreground/60 mb-2">
              Track revenue and performance metrics
            </p>
            <span className="text-xs text-blue-500 group-hover:text-blue-600 transition-colors">
              See analytics →
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}