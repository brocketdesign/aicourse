import { NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb';
import Payment from '@/models/Payment';
// import { isAdmin } from '@/services/user'; // Optional: For authorization

// Helper function to generate date labels for the last N days/months/years
const getDateLabels = (period: 'day' | 'month' | 'year', count: number): string[] => {
  const labels: string[] = [];
  const today = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(today);
    if (period === 'day') {
      date.setDate(today.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    } else if (period === 'month') {
      date.setMonth(today.getMonth() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    } else if (period === 'year') {
      date.setFullYear(today.getFullYear() - i);
      labels.push(date.getFullYear().toString());
    }
  }

  return labels;
};

export async function GET() {
  // Optional: Add authentication and authorization check
  // const authorized = await isAdmin(); // Make sure isAdmin is an async function if used
  // if (!authorized) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  // }

  try {
    await connect();

    // For simplicity, let's assume we are fetching daily revenue for the last 30 days
    const periodType = 'day'; // Can be 'month' or 'year' based on query params or default
    const periodCount = 30;
    const labels = getDateLabels(periodType, periodCount);
    // Explicitly type revenueData
    const revenueData: number[] = new Array(labels.length).fill(0);

    // Fetch payments within the date range
    const today = new Date();
    const startDate = new Date();
    if (periodType === 'day') startDate.setDate(today.getDate() - periodCount);
    // Add similar logic for 'month' and 'year' if needed

    // Explicitly type payments
    const payments: any[] = await Payment.find({
      status: 'succeeded',
      createdAt: { $gte: startDate, $lte: today },
    }).lean(); // Use .lean() for performance if not modifying docs

    // Aggregate revenue by date
    payments.forEach(payment => {
      const paymentDate = new Date(payment.createdAt);
      let labelIndex = -1;

      if (periodType === 'day') {
        // Find the corresponding label (e.g., "May 07")
        const formattedPaymentDate = paymentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        labelIndex = labels.indexOf(formattedPaymentDate);
      }
      // Add similar logic for 'month' and 'year' if needed

      if (labelIndex !== -1) {
        revenueData[labelIndex] += payment.amount / 100; // Assuming amount is in cents
      }
    });

    return NextResponse.json({
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: revenueData,
          borderColor: '#3b82f6', // blue-500
          backgroundColor: 'rgba(59, 130, 246, 0.1)', // Lighter blue for area fill
          fill: true,
          tension: 0.3,
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    // Type the error
    return NextResponse.json({ error: `Failed to fetch revenue data: ${(error as Error).message}` }, { status: 500 });
  }
}
