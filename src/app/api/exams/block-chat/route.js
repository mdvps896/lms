import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';

export async function POST(request) {
    try {
        await connectDB();

        const { attemptId, blocked } = await request.json();

        if (!attemptId || blocked === undefined) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        const attempt = await ExamAttempt.findById(attemptId);

        if (!attempt) {
            return NextResponse.json(
                { message: 'Attempt not found' },
                { status: 404 }
            );
        }

        attempt.chatBlocked = blocked;
        await attempt.save();

        return NextResponse.json({
            message: blocked ? 'Chat blocked successfully' : 'Chat unblocked successfully',
            success: true
        });
    } catch (error) {
        console.error('Error blocking/unblocking chat:', error);
        return NextResponse.json(
            { message: 'Failed to update chat status', error: error.message },
            { status: 500 }
        );
    }
}
