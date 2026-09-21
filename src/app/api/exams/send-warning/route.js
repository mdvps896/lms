import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Exam from '@/models/Exam';
import { requirePermission } from '@/utils/apiAuth';

export async function POST(request) {
    // 🔒 SECURITY: this is a proctor action. It had no authorization check at
    // all, so any logged-in student could invoke it against another
    // candidate's attempt.
    const authError = await requirePermission(request, 'manage_live_exams');
    if (authError) return authError;

    try {
        await connectDB();

        const { attemptId, message } = await request.json();

        if (!attemptId || !message) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Find exam with this attempt
        const exam = await Exam.findOne({ 'attempts._id': attemptId });

        if (!exam) {
            return NextResponse.json(
                { message: 'Exam attempt not found' },
                { status: 404 }
            );
        }

        const attempt = exam.attempts.id(attemptId);

        if (!attempt) {
            return NextResponse.json(
                { message: 'Attempt not found' },
                { status: 404 }
            );
        }

        // Add warning to chat messages
        attempt.chatMessages.push({
            sender: 'admin',
            message: `⚠️ WARNING: ${message}`,
            timestamp: new Date(),
            read: false
        });

        await exam.save();

        return NextResponse.json({
            message: 'Warning sent successfully',
            success: true
        });
    } catch (error) {
        console.error('Error sending warning:', error);
        return NextResponse.json(
            { message: 'Failed to send warning', error: error.message },
            { status: 500 }
        );
    }
}
