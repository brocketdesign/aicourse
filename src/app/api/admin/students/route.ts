import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb';
import User, { IUser } from '@/models/User'; // Import IUser
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  const authResult = await auth(); // Await the auth() call
  // TODO: Add proper role-based access control here
  // Check if user is logged in and potentially if they are an admin
  if (!authResult.userId) { // Use authResult.userId
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Optional: Add admin role check
  // const userRole = authResult.sessionClaims?.metadata?.role;
  // if (userRole !== 'admin') {
  //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  // }

  try {
    await connect();

    // Fetch users without .lean() to avoid type issues with _id for now
    const users: IUser[] = await User.find({})
      .select('firstName lastName email role enrolledCourses lastLogin createdAt')
      .populate('enrolledCourses', 'title')
      .sort({ createdAt: -1 });
      // .lean(); // Removed lean for simplicity and type safety

    const formattedUsers = users.map(user => ({
      id: user._id.toString(), // Now _id should be correctly typed from IUser
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
      email: user.email,
      role: user.role,
      enrolledCoursesCount: user.enrolledCourses?.length || 0,
      lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
      createdAt: new Date(user.createdAt).toLocaleDateString(),
    }));

    return NextResponse.json(formattedUsers);
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users', details: error.message }, { status: 500 });
  }
}
