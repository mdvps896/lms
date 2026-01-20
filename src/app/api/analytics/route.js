
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';
import Course from '@/models/Course';
import FreeMaterial from '@/models/FreeMaterial';
import User from '@/models/User';
import PDFViewSession from '@/models/PDFViewSession';
import Payment from '@/models/Payment';
import mongoose from 'mongoose';

export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        // Default date range (last 30 days) if not provided
        const endDate = endDateParam ? new Date(endDateParam) : new Date();
        const startDate = startDateParam ? new Date(startDateParam) : new Date();
        if (!startDateParam) startDate.setDate(startDate.getDate() - 30);

        // --- 1. Exam Activity Over Time (Line Chart) ---
        const examActivity = await ExamAttempt.aggregate([
            {
                $match: {
                    startedAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$startedAt" } },
                    count: { $sum: 1 },
                    avgScore: { $avg: "$score" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // --- 2. Status Distribution (Pie Chart) ---
        const examStatus = await ExamAttempt.aggregate([
            {
                $match: {
                    startedAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // --- 3. Browser/Device Stats (Donut Chart) ---
        // Using $ifNull to handle missing browserInfo
        const deviceStats = await ExamAttempt.aggregate([
            {
                $match: {
                    startedAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $ifNull: ["$browserInfo.name", "Unknown"] },
                    count: { $sum: 1 }
                }
            }
        ]);

        // --- 4. Counts (Cards) ---
        const totalUsers = await User.countDocuments();
        const totalCourses = await Course.countDocuments();
        const totalMaterials = await FreeMaterial.countDocuments();
        const activeExamAttempts = await ExamAttempt.countDocuments({ status: 'active' });

        // --- 5. Attempts per Category (Bar Chart) ---
        const attemptsPerCategory = await ExamAttempt.aggregate([
            { $match: { startedAt: { $gte: startDate, $lte: endDate } } },
            {
                $lookup: {
                    from: "exams", // Collection name is lowercase plural usually
                    localField: "exam",
                    foreignField: "_id",
                    as: "examDetails"
                }
            },
            { $unwind: "$examDetails" },
            {
                $lookup: {
                    from: "categories",
                    localField: "examDetails.category",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            { $unwind: "$categoryDetails" },
            {
                $group: {
                    _id: "$categoryDetails.name",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // --- 6. Score Distribution (Bar Chart) ---
        const scoreDistribution = await ExamAttempt.aggregate([
            {
                $match: {
                    startedAt: { $gte: startDate, $lte: endDate },
                    status: 'submitted',
                    percentage: { $exists: true }
                }
            },
            {
                $bucket: {
                    groupBy: "$percentage",
                    boundaries: [0, 20, 40, 60, 80, 101],
                    default: "Other",
                    output: {
                        count: { $sum: 1 }
                    }
                }
            }
        ]);

        // --- 5. Recent Activity (Table) ---
        const recentAttempts = await ExamAttempt.find({ startedAt: { $exists: true } })
            .sort({ startedAt: -1 })
            .limit(50)
            .populate('user', 'name email')
            .populate('exam', 'name')
            .lean();

        // --- 6. Recent Materials (Table proxy for "PDF Views") ---
        const recentMaterials = await FreeMaterial.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('category', 'name')
            .lean();

        // --- 6.1 Recent PDF View Sessions ---
        const recentPDFViews = await PDFViewSession.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('user', 'name email')
            .lean();

        // --- 6.2 Recent Payments ---
        const recentPayments = await Payment.find({ status: 'success' })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('user', 'name email')
            .populate('course', 'title')
            .lean();

        // --- 7. PDF View Analytics ---
        const pdfViews = await PDFViewSession.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: "$pdfName",
                    views: { $sum: 1 },
                    totalDuration: { $sum: "$duration" },
                    uniqueUsers: { $addToSet: "$user" }
                }
            },
            {
                $project: {
                    name: "$_id",
                    views: 1,
                    avgDuration: { $divide: ["$totalDuration", "$views"] },
                    users: { $size: "$uniqueUsers" }
                }
            },
            { $sort: { views: -1 } },
            { $limit: 10 }
        ]);

        // --- 8. Course Sales Analytics ---
        const courseSales = await Payment.aggregate([
            {
                $match: {
                    status: 'success',
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $lookup: {
                    from: "courses",
                    localField: "course",
                    foreignField: "_id",
                    as: "courseDetails"
                }
            },
            { $unwind: "$courseDetails" },
            {
                $group: {
                    _id: "$courseDetails.title",
                    sales: { $sum: 1 },
                    revenue: { $sum: "$amount" }
                }
            },
            {
                $project: {
                    name: "$_id",
                    sales: 1,
                    revenue: 1
                }
            },
            { $sort: { sales: -1 } },
            { $limit: 10 }
        ]);

        return NextResponse.json({
            success: true,
            data: {
                chartData: {
                    activity: examActivity,
                    status: examStatus,
                    devices: deviceStats,
                    categories: attemptsPerCategory,
                    scores: scoreDistribution,
                    pdfViews: pdfViews,
                    courseSales: courseSales
                },
                counts: {
                    users: totalUsers,
                    courses: totalCourses,
                    materials: totalMaterials,
                    activeExams: activeExamAttempts
                },
                recentActivity: recentAttempts,
                recentMaterials: recentMaterials,
                recentPDFViews: recentPDFViews,
                recentPayments: recentPayments
            }
        });

    } catch (error) {
        console.error('Analytics API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch analytics data' },
            { status: 500 }
        );
    }
}
