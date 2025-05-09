import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb';
import Payment, { IPayment } from '@/models/Payment'; // Import IPayment
import User from '@/models/User';
import Course from '@/models/Course';
// import { isAdmin } from '@/services/user'; // Optional: For authorization

export async function GET() {
  // Optional: Add authentication and authorization check
  // const authorized = await isAdmin();
  // if (!authorized) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  // }

  try {
    await connect();

    // Fetch the 5 most recent successful payments
    // Populate user and course details
    // Explicitly type recentPayments
    const recentPayments: IPayment[] = await Payment.find({ status: 'succeeded' })
      .sort({ createdAt: -1 }) // Sort by creation date descending
      .limit(5) // Limit to 5 results
      .populate({
        path: 'userId',
        select: 'firstName lastName email', // Select specific fields from User
        model: User
      })
      .populate({
        path: 'courseId',
        select: 'title', // Select specific fields from Course
        model: Course
      })
      .lean(); // Use lean for performance if not modifying docs

    // Format the data for the frontend
    const formattedEnrollments = recentPayments.map(payment => {
      // Type guards to ensure populated fields exist
      const user = payment.userId as unknown as { _id: string; firstName?: string; lastName?: string; email: string } | null;
      const course = payment.courseId as unknown as { _id: string; title: string } | null;
      
      return {
        id: payment._id.toString(),
        name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown User',
        email: user ? user.email : 'unknown@example.com',
        course: course ? course.title : 'Unknown Course',
        date: payment.createdAt.toISOString().split('T')[0], // Format as YYYY-MM-DD
        amount: payment.amount / 100, // Convert cents to dollars
      };
    });

    return NextResponse.json(formattedEnrollments);

  } catch (error) {
    console.error('Error fetching recent enrollments:', error);
    // Type the error
    return NextResponse.json({ error: `Failed to fetch recent enrollments: ${(error as Error).message}` }, { status: 500 });
  }
}
