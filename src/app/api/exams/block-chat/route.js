import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';
import { requirePermission } from '@/utils/apiAuth';

export async function POST(request) {
    // 🔒 SECURITY: this is a proctor action. It had no authorization check at
    // all, so any logged-in student could invoke it against another
    // candidate's attempt.
    const authError = await requirePermission(request, 'manage_live_exams');
    if (authError) return authError;

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
