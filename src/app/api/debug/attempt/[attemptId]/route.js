import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';

export async function GET(request, { params }) {
    try {
        await connectDB();

        const { attemptId } = params;

        const attempt = await ExamAttempt.findById(attemptId)
            .populate('exam', 'name duration')
            .lean();

        if (!attempt) {
            return NextResponse.json({
                success: false,
                message: 'Attempt not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            attempt: {
                _id: attempt._id,
                status: attempt.status,
                isActive: attempt.isActive,
                startedAt: attempt.startedAt,
                submittedAt: attempt.submittedAt,
                score: attempt.score,
                totalMarks: attempt.totalMarks,
                percentage: attempt.percentage,
                exam: attempt.exam,
                answersCount: attempt.answers ? Object.keys(attempt.answers).length : 0
            }
        });
    } catch (error) {
        console.error('Debug error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
