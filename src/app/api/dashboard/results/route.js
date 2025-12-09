import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Exam from '@/models/Exam';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();

        // Get exam data for the last 12 months
        const currentDate = new Date();
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const categories = [];
        const monthlyData = {
            completed: [],
            active: [],
            total: []
        };

        // Generate last 12 months
        for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthName = monthNames[date.getMonth()];
            const year = String(date.getFullYear()).slice(-2);
            categories.push(`${monthName}/${year}`);

            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

            // Count exams by status for this month
            const [completed, active, total] = await Promise.all([
                Exam.countDocuments({
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                    endDate: { $lt: new Date() }
                }),
                Exam.countDocuments({
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                    status: 'active',
                    endDate: { $gte: new Date() }
                }),
                Exam.countDocuments({
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                })
            ]);

            monthlyData.completed.push(completed);
            monthlyData.active.push(active);
            monthlyData.total.push(total);
        }

        // Calculate totals
        const totalCompleted = await Exam.countDocuments({ endDate: { $lt: new Date() } });
        const totalActive = await Exam.countDocuments({ 
            status: 'active',
            endDate: { $gte: new Date() }
        });
        const totalExams = await Exam.countDocuments();
        const totalPending = totalExams - totalCompleted - totalActive;

        return NextResponse.json({
            success: true,
            data: {
                categories,
                series: [
                    {
                        name: "Total Exams",
                        type: "bar",
                        data: monthlyData.total
                    },
                    {
                        name: "Completed Exams",
                        type: "line",
                        data: monthlyData.completed
                    },
                    {
                        name: "Active Exams",
                        type: "bar",
                        data: monthlyData.active
                    }
                ],
                totals: {
                    active: totalActive,
                    completed: totalCompleted,
                    pending: totalPending,
                    total: totalExams
                }
            }
        });
    } catch (error) {
        console.error('Error fetching result records:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch result records' },
            { status: 500 }
        );
    }
}
