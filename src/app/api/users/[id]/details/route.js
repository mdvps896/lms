import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import ExamAttempt from '@/models/ExamAttempt';
import Category from '@/models/Category';
import Exam from '@/models/Exam'; // Ensure Exam is registered

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { id } = params;

        const user = await User.findById(id)
            .select('-password -twoFactorSecret')
            .populate('category', 'name')
            .lean();

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Fetch Exam Attempts
        const attempts = await ExamAttempt.find({ user: id })
            .populate('exam', 'title duration totalMarks passPercentage')
            .sort({ startedAt: -1 })
            .lean();

        // Calculate stats
        const totalAttempts = attempts.length;
        const passedAttempts = attempts.filter(a => {
            if (!a.exam || !a.percentage) return false;
            return a.percentage >= (a.exam.passPercentage || 0);
        }).length;

        // Last Activity (Login or Exam)
        // Since we don't have an explicit lastLogin field, we'll use the latest exam attempt or updatedAt
        const lastActivity = attempts.length > 0 ? attempts[0].startedAt : user.updatedAt;

        // Placeholder for PDF views (if we implement a tracking model later)
        // const pdfViews = await PDFView.find({ user: id }).populate('pdf').sort({ viewedAt: -1 });

        const details = {
            user: {
                ...user,
                lastActivity // enriching user object
            },
            examStats: {
                total: totalAttempts,
                passed: passedAttempts,
            },
            attempts: attempts.map(attempt => ({
                id: attempt._id,
                examTitle: attempt.exam?.title || 'Unknown Exam',
                startedAt: attempt.startedAt,
                submittedAt: attempt.submittedAt,
                status: attempt.status,
                score: attempt.score,
                totalMarks: attempt.totalMarks,
                percentage: attempt.percentage,
                result: attempt.percentage >= (attempt.exam?.passPercentage || 0) ? 'Pass' : 'Fail'
            })),
            pdfViews: [] // Placeholder
        };

        return NextResponse.json({ success: true, data: details });
    } catch (error) {
        console.error('Error fetching student details:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
