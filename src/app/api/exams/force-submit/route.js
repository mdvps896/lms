import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export async function POST(request) {
    try {
        await connectDB();

        const currentUser = await getAuthenticatedUser(request);
        if (!currentUser) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { attemptId } = await request.json();

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

        const requesterId = currentUser.id || currentUser._id?.toString();
        if (
            currentUser.role !== 'admin' &&
            currentUser.role !== 'teacher' &&
            attempt.user?.toString() !== requesterId
        ) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
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
