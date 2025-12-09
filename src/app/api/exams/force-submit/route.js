import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';

export async function POST(request) {
    try {
        await connectDB();

        const { attemptId } = await request.json();

        console.log('Force submit - Attempt ID:', attemptId);

        if (!attemptId) {
            return NextResponse.json(
                { message: 'Missing attempt ID' },
                { status: 400 }
            );
        }

        // Find the ExamAttempt
        const attempt = await ExamAttempt.findById(attemptId);

        if (!attempt) {
            return NextResponse.json(
                { message: 'Attempt not found' },
                { status: 404 }
            );
        }

        if (attempt.status !== 'active') {
            return NextResponse.json(
                { message: 'Attempt is not active' },
                { status: 400 }
            );
        }

        // Force submit the exam
        attempt.status = 'submitted';
        attempt.isActive = false;
        attempt.submittedAt = new Date();

        await attempt.save();

        console.log('Force submitted successfully');

        return NextResponse.json({
            message: 'Exam force submitted successfully'
        });
    } catch (error) {
        console.error('Error force submitting exam:', error);
        return NextResponse.json(
            { message: 'Failed to force submit exam', error: error.message },
            { status: 500 }
        );
    }
}
