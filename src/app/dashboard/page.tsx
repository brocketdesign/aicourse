import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardClient from "../../components/dashboard/DashboardClient";
import { connect } from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";

export default async function DashboardPage() {
  // Get authentication data from Clerk
  const authResult = await auth(); // Await the auth() call
  const { userId } = authResult;
  // console.log("Dashboard Page - Auth Result:", authResult); // Commented out verbose log
  console.log("Dashboard Page - User ID:", userId); // Log the extracted userId

  // If no userId, middleware should have handled redirect
  if (!userId) {
    // This check might still be useful as a safeguard
    console.error("Dashboard Page - No userId found after await auth(), returning 'Authentication required'");
    return <div className="p-8 text-center">Authentication required</div>;
  }

  try {
    // Fetch the user from Clerk
    const user = await currentUser();
    console.log("Dashboard Page - Current User:", user); // Log the user object

    if (!user) {
      // This should also rarely happen
      console.error("Dashboard Page - currentUser() returned null, returning 'Unable to load user profile'");
      return <div className="p-8 text-center">Unable to load user profile</div>;
    }

    // Sanitize user object for Client Component
    const plainUser = user ? {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.emailAddresses[0]?.emailAddress,
      imageUrl: user.imageUrl,
      // Add any other primitive fields needed by DashboardClient
    } : null;

    if (!plainUser) {
      console.error("Dashboard Page - Failed to create plain user object");
      return <div className="p-8 text-center">Unable to load user profile</div>;
    }

    // Connect to MongoDB
    await connect();

    // Find user in our database
    const dbUser = await User.findOne({ clerkId: userId });

    // If user doesn't exist in our database yet, create a new record
    if (!dbUser) {
      const newUser = new User({
        clerkId: userId,
        email: user.emailAddresses[0]?.emailAddress || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        imageUrl: user.imageUrl || "",
        role: "student",
        enrolledCourses: []
      });

      await newUser.save();
      console.log(`Created new database user for ${userId}`);

      // Show empty dashboard for new users
      return <DashboardClient user={plainUser} courses={[]} />;
    }

    // Fetch the enrolled courses and sanitize
    let enrolledCourses = [];
    if (dbUser.enrolledCourses && dbUser.enrolledCourses.length > 0) {
      const rawEnrolledCourses = await Course.find({
        _id: { $in: dbUser.enrolledCourses }
      }).lean();
      // Deep clone/sanitize using JSON stringify/parse
      enrolledCourses = JSON.parse(JSON.stringify(rawEnrolledCourses));
      console.log(`Found ${enrolledCourses.length} enrolled courses for user ${userId}`);
    }

    // Get courses for recommendations (courses user is not enrolled in) and sanitize
    const allCoursesRaw = await Course.find().lean();
    const availableCoursesRaw = allCoursesRaw.filter(
      course => !dbUser.enrolledCourses.some(
        id => id.toString() === course._id.toString()
      )
    );
    // Deep clone/sanitize using JSON stringify/parse
    const availableCourses = JSON.parse(JSON.stringify(availableCoursesRaw));

    // Render the dashboard with the sanitized data
    return (
      <DashboardClient
        user={plainUser} // Pass the sanitized user object
        courses={enrolledCourses} // Pass sanitized courses
        availableCourses={availableCourses.slice(0, 3)} // Pass sanitized available courses
      />
    );
  } catch (error) {
    console.error("Error loading dashboard:", error);

    // Show a friendly error message
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-700">
            We encountered an error while loading your dashboard. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }
}