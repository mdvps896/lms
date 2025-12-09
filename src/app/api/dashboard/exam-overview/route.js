import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Exam from '@/models/Exam';

export async function GET() {
    try {
        await connectDB();

        const now = new Date();
        
        // Get exam counts
        const [totalExams, completedExams] = await Promise.all([
            Exam.countDocuments(),
            Exam.countDocuments({ endDate: { $lt: now } })
        ]);

        // Get monthly data for last 7 months for chart
        const chartData = {
            total: [],
            completed: []
        };

        for (let i = 6; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const [monthTotal, monthCompleted] = await Promise.all([
                Exam.countDocuments({
                    createdAt: { $gte: monthStart, $lte: monthEnd }
                }),
                Exam.countDocuments({
                    createdAt: { $gte: monthStart, $lte: monthEnd },
                    endDate: { $lt: now }
                })
            ]);

            chartData.total.push(monthTotal);
            chartData.completed.push(monthCompleted);
        }

        const completionRate = totalExams > 0 ? Math.round((completedExams / totalExams) * 100) : 0;
        const activeRate = totalExams > 0 ? Math.round(((totalExams - completedExams) / totalExams) * 100) : 0;

        const stats = [
            {
                title: "Exams Completed",
                icon: "feather-check-circle",
                total_number: totalExams,
                completed_number: completedExams,
                progress: completionRate,
                chartColor: "#3454d1",
                color: "primary",
                chartData: chartData.completed
            },
            {
                title: "Active Exams",
                icon: "feather-activity",
                total_number: totalExams,
                completed_number: totalExams - completedExams,
                progress: activeRate,
                chartColor: "#25b865",
                color: "success",
                chartData: chartData.total.map((total, i) => total - chartData.completed[i])
            }
        ];

        return NextResponse.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching exam overview:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch exam overview' },
            { status: 500 }
        );
    }
}
