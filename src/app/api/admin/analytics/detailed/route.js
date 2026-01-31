import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/utils/apiAuth';
import Payment from '@/models/Payment';
import Course from '@/models/Course';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '7d';
        const customStart = searchParams.get('startDate');
        const customEnd = searchParams.get('endDate');

        let startDate = new Date();
        let endDate = new Date();
        let labelsCount = 7;

        if (range === 'custom' && customStart && customEnd) {
            startDate = new Date(customStart);
            endDate = new Date(customEnd);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            const diffTime = Math.abs(endDate - startDate);
            labelsCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        } else if (range === '30d') {
            startDate.setDate(startDate.getDate() - 29);
            startDate.setHours(0, 0, 0, 0);
            labelsCount = 30;
        } else if (range === 'today') {
            startDate.setHours(0, 0, 0, 0);
            labelsCount = 1;
        } else {
            startDate.setDate(startDate.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            labelsCount = 7;
        }

        // Aggregate Sales Data
        const salesData = await Payment.aggregate([
            {
                $match: {
                    status: 'success',
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    dailyRevenue: { $sum: "$amount" },
                    dailyOrders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Trending Items (Top Courses by Payment Count)
        const trendingItems = await Payment.aggregate([
            {
                $match: {
                    status: 'success',
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: "$course",
                    totalSales: { $sum: 1 },
                    revenue: { $sum: "$amount" }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "courses",
                    localField: "_id",
                    foreignField: "_id",
                    as: "courseInfo"
                }
            },
            { $unwind: "$courseInfo" },
            {
                $project: {
                    name: "$courseInfo.title",
                    brand: "Course",
                    sales: "$totalSales",
                    revenue: "$revenue",
                    imageUrl: "$courseInfo.thumbnail"
                }
            }
        ]);

        // Format chart data
        const labels = [];
        const orderData = [];
        let totalRevenue = 0;
        const daysNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 0; i < labelsCount; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const key = date.toISOString().split('T')[0];

            labels.push(labelsCount > 7 ? date.getDate().toString() : daysNames[date.getDay()]);

            const daySales = salesData.find(s => s._id === key);
            const count = daySales ? daySales.dailyOrders : 0;
            const revenue = daySales ? daySales.dailyRevenue : 0;

            orderData.push(count);
            totalRevenue += revenue;
        }

        const averageSales = labelsCount > 0 ? (totalRevenue / labelsCount).toFixed(2) : 0;

        return NextResponse.json({
            success: true,
            data: {
                totalSales: totalRevenue,
                averageSales: parseFloat(averageSales),
                labels,
                orderData,
                trendingItems
            }
        });

    } catch (error) {
        console.error('Detailed analytics error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
