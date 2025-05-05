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

    // Aggregate revenue by month for the last 5 months
    const revenueData = await Payment.aggregate([
      {
        $match: {
          status: 'succeeded',
          createdAt: { $gte: fiveMonthsAgo } // Filter payments from the last 5 months
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          monthlyRevenue: { $sum: '$amount' } // Sum amounts (in cents)
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
          amount: { $divide: ['$monthlyRevenue', 100] } // Convert cents to dollars
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

    const formattedRevenueData = lastFiveMonths.map(monthName => {
      const found = revenueData.find(d => d.month === monthName);
      return found || { month: monthName, amount: 0 };
    });

    return NextResponse.json(formattedRevenueData);

  } catch (error) {
    console.error('Error fetching monthly revenue data:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
  }
}
