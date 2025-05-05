import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb';
import Payment from '@/models/Payment';
import { isAdmin } from '@/services/user'; // Optional: For authorization

export async function GET() {
  // Optional: Add authentication and authorization check
  // const authorized = await isAdmin();
  // if (!authorized) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  // }

  try {
    await connect();

    // Get the date 5 months ago from today
    const fiveMonthsAgo = new Date();
    fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);
    fiveMonthsAgo.setDate(1); // Start from the beginning of that month
    fiveMonthsAgo.setHours(0, 0, 0, 0);

    // Aggregate enrollment count by month for the last 5 months
    const enrollmentData = await Payment.aggregate([
      {
        $match: {
          status: 'succeeded', // Count successful enrollments
          createdAt: { $gte: fiveMonthsAgo } // Filter payments from the last 5 months
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          monthlyEnrollments: { $sum: 1 } // Count documents in each group
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 } // Sort chronologically
      },
      {
        $project: {
          _id: 0,
          month: {
            // Format month name (e.g., "Jan", "Feb")
            $let: {
              vars: {
                monthsInString: [null, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
              },
              in: { $arrayElemAt: ['$$monthsInString', '$_id.month'] }
            }
          },
          count: '$monthlyEnrollments'
        }
      }
    ]);

    // Ensure we have data for all last 5 months, filling gaps with 0
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = new Date().getMonth(); // 0-11
    const lastFiveMonths = [];
    for (let i = 4; i >= 0; i--) {
      const monthIndex = (currentMonthIndex - i + 12) % 12;
      lastFiveMonths.push(monthNames[monthIndex]);
    }

    const formattedEnrollmentData = lastFiveMonths.map(monthName => {
      const found = enrollmentData.find(d => d.month === monthName);
      return found || { month: monthName, count: 0 };
    });

    return NextResponse.json(formattedEnrollmentData);

  } catch (error) {
    console.error('Error fetching monthly enrollment data:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollment data' }, { status: 500 });
  }
}
