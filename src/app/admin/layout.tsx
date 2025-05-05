import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server"; // Corrected import path
import AdminSidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/Header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  console.log("AdminLayout: Checking auth status...");
  console.log("AdminLayout: userId:", userId);

  if (!userId) {
    console.log("AdminLayout: No userId found, redirecting to /auth/sign-in");
    redirect("/auth/sign-in");
  }

  console.log("AdminLayout: User is authenticated, rendering admin layout.");
  console.log("[AdminLayout] Rendering admin layout.");
  // In a production app, we would check if the user is an admin here
  // using the user service or Clerk metadata

  return (
    <div className="min-h-screen bg-background/95">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}