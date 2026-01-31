import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/utils/apiAuth';
import StudentActivity from '@/models/StudentActivity';
import PDFViewSession from '@/models/PDFViewSession';

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

            // Calculate number of days between dates
            const diffTime = Math.abs(endDate - startDate);
            labelsCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            if (labelsCount <= 0) labelsCount = 1;
        } else if (range === '30d') {
            startDate.setDate(startDate.getDate() - 29);
            startDate.setHours(0, 0, 0, 0);
            labelsCount = 30;
        } else {
            // default 7d
            startDate.setDate(startDate.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            labelsCount = 7;
        }

        const groupFormat = "%Y-%m-%d";

        // Aggregate Course Views (from StudentActivity where activityType is 'course_view')
        const courseViews = await StudentActivity.aggregate([
            {
                $match: {
                    activityType: 'course_view',
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Aggregate PDF Views (from PDFViewSession)
        const pdfViews = await PDFViewSession.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Format data for the selected range
        const labels = [];
        const courseData = [];
        const pdfData = [];
        let totalCourseViews = 0;
        let totalPdfViews = 0;

        const daysNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 0; i < labelsCount; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const key = dateStr;

            let label = "";
            if (labelsCount > 7) {
                // For long ranges, just show the day of the month
                label = date.getDate().toString();
            } else {
                label = daysNames[date.getDay()];
            }

            labels.push(label);

            const courseMatch = courseViews.find(v => v._id === key);
            const cCount = courseMatch ? courseMatch.count : 0;
            courseData.push(cCount);
            totalCourseViews += cCount;

            const pdfMatch = pdfViews.find(v => v._id === key);
            const pCount = pdfMatch ? pdfMatch.count : 0;
            pdfData.push(pCount);
            totalPdfViews += pCount;
        }

        return NextResponse.json({
            success: true,
            data: {
                labels,
                courseViews: courseData,
                pdfViews: pdfData,
                totalCourseViews,
                totalPdfViews
            }
        });

    } catch (error) {
        console.error('Charts data error:', error);
        return NextResponse.json({
            success: false,
            message: 'Internal Server Error'
        }, { status: 500 });
    }
}
