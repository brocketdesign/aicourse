import { NextResponse, NextRequest } from 'next/server';
import { connect } from '@/lib/mongodb';
import User, { IUser } from '@/models/User'; // Import IUser
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) { // Use NextRequest, req can be used for query params if needed in future
  const authResult = await auth();
  // Add admin check: (authResult.sessionClaims as any)?.metadata?.role !== 'admin'
  if (!authResult?.userId ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connect();

    // Fetch all users (or paginate if the list can be very long)
    // Explicitly type users
    const users: IUser[] = await User.find({}).sort({ createdAt: -1 }); // Sort by newest first

    // Format users for the admin dashboard
    // Explicitly type formattedUsers
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
      email: user.email,
      role: user.role,
      enrolledCoursesCount: user.enrolledCourses?.length || 0,
      lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
      createdAt: new Date(user.createdAt).toLocaleDateString(),
      // Add other fields as needed, e.g., user.imageUrl
    }));

    return NextResponse.json(formattedUsers);
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users', details: error.message }, { status: 500 });
  }
}
