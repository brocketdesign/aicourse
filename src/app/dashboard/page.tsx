import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/dashboard/DashboardClient"; // Import the client component
import { connect } from "@/lib/mongodb";
import User from "@/models/User";
// Removed Course, Module, Lesson imports as they are not fetched here anymore

export default async function DashboardPage() {
  const { userId } = await auth(); // Await the auth() call

  if (!userId) {
    redirect("/sign-in");
  }

  try {
    // Fetch the Clerk user data
    const user = await currentUser();

    if (!user) {
      console.error("Dashboard Page - currentUser() returned null");
      redirect("/sign-in");
    }

    // Connect to MongoDB
    await connect();

    // Find or create user in our database (ensure user exists)
    let dbUser = await User.findOne({ clerkId: userId });

    if (!dbUser) {
      console.log(`Dashboard Page - User ${userId} not found in DB, creating...`);
      const newUser = new User({
        clerkId: userId,
        email: user.emailAddresses[0]?.emailAddress || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        imageUrl: user.imageUrl || "",
        role: "student", // Default role
        enrolledCourses: [],
        progress: new Map() // Initialize progress map
      });
      dbUser = await newUser.save();
      console.log(`Dashboard Page - Created new user ${dbUser._id} for Clerk ID ${userId}`);
    } else {
      // Optionally update user details if they changed in Clerk
      let needsUpdate = false;
      if (dbUser.email !== (user.emailAddresses[0]?.emailAddress || "")) {
        dbUser.email = user.emailAddresses[0]?.emailAddress || "";
        needsUpdate = true;
      }
      if (dbUser.firstName !== (user.firstName || "")) {
        dbUser.firstName = user.firstName || "";
        needsUpdate = true;
      }
      if (dbUser.lastName !== (user.lastName || "")) {
        dbUser.lastName = user.lastName || "";
        needsUpdate = true;
      }
      if (dbUser.imageUrl !== (user.imageUrl || "")) {
        dbUser.imageUrl = user.imageUrl || "";
        needsUpdate = true;
      }
      if (needsUpdate) {
        await dbUser.save();
        console.log(`Dashboard Page - Updated user details for ${dbUser._id}`);
      }
    }

    // No need to fetch enrolled courses here anymore
    // The DashboardClient component will handle fetching its own data

    return (
      <main className="flex-1 p-4 md:p-8">
        {/* Render the client component which handles data fetching and display */}
        <DashboardClient />
      </main>
    );

  } catch (error) {
    console.error("Error loading dashboard:", error);
    // Handle error appropriately, maybe show an error page or message
    // For now, redirecting to home or showing a simple message
    return (
      <main className="flex-1 p-4 md:p-8">
        <div className="text-center text-red-600">
          <h2>Error Loading Dashboard</h2>
          <p>There was a problem loading your dashboard. Please try again later.</p>
        </div>
      </main>
    );
  }
}