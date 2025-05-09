import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb';
import User from '@/models/User';
// import Course from '@/models/Course'; // Course is not used
import Payment from '@/models/Payment'; // Import the Payment model
// import { isAdmin } from '@/services/user'; // Assuming you have an isAdmin check

// Helper function to calculate percentage change
/* const calculatePercentageChange = (current: number, previous: number): string => {
  if (previous === 0) {
    return current > 0 ? '+∞%' : '0%'; // Handle division by zero
  }
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
}; */

export async function GET() {
  // Optional: Add authentication and authorization check
  // const authorized = await isAdmin(); // Make sure isAdmin is an async function if used
  // if (!authorized) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  // }

  try {
    await connect();

    const thirtyDaysAgo = new Date(); // For previous period calculation example
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Total Revenue (sum of all successful payments)
    // Explicitly type revenueAggregation
    const revenueAggregation: any[] = await Payment.aggregate([
      { $match: { status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].total / 100 : 0; // Convert cents to dollars

    // 2. Active Students (count of users with role 'student' - adjust as needed for your definition of active)
    const totalStudents = await User.countDocuments({ role: 'student' });
    // Option B: Count unique users who made a successful payment
    // const uniquePayingUsers = await Payment.distinct('userId', { status: 'succeeded' });
    // const totalStudents = uniquePayingUsers.length;

    // 3. Total Enrollments (count successful payment records)
    const totalEnrollments = await Payment.countDocuments({ status: 'succeeded' });

    // 4. Course Completion Rate (Placeholder - requires detailed progress tracking)
    const courseCompletionRate = 72.5; // Placeholder

    // 5. Churn Rate (Placeholder - requires tracking subscription cancellations or inactivity)
    const churnRate = 3.2; // Placeholder

    // --- Calculate Changes (vs. Previous Period - simplified example: vs. all time before last month) ---
    // This requires more sophisticated date filtering based on a defined period (e.g., last 30 days vs. previous 30 days)
    // For simplicity, we'll use placeholders for change percentages for now.
    const revenueChange = '+30.5%'; // Placeholder
    const studentsChange = '+12.3%'; // Placeholder
    const completionChange = '+4.8%'; // Placeholder
    const churnChange = '-1.5%'; // Placeholder (Note: decrease might be positive)

    const stats = {
      totalRevenue: {
        value: totalRevenue,
        change: revenueChange, // Placeholder
        positive: true, // Placeholder
      },
      activeStudents: {
        value: totalStudents,
        change: studentsChange, // Placeholder
        positive: true, // Placeholder
      },
      totalEnrollments: { // Added total enrollments as a potential stat
        value: totalEnrollments,
        change: '+15.0%', // Placeholder
        positive: true, // Placeholder
      },
      courseCompletion: { // Placeholder
        value: `${courseCompletionRate}%`,
        change: completionChange, // Placeholder
        positive: true, // Placeholder
      },
      churnRate: { // Placeholder
        value: `${churnRate}%`,
        change: churnChange, // Placeholder
        positive: false, // Placeholder
      },
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    // Type the error
    return NextResponse.json({ error: `Failed to fetch admin statistics: ${(error as Error).message}` }, { status: 500 });
  }
}
