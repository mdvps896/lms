import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';

// Send message (Admin or Student)
export async function POST(request) {
    try {
        await connectDB();

        const { attemptId, examId, sender, message } = await request.json();

        if (!attemptId || !sender || !message) {
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

        // Check if chat is blocked (only for students)
        if (sender === 'student' && attempt.chatBlocked) {
            return NextResponse.json(
                { message: 'Chat is blocked by admin' },
                { status: 403 }
            );
        }

        // Initialize chatMessages array if not exists
        if (!attempt.chatMessages) {
            attempt.chatMessages = [];
        }

        // Add message
        attempt.chatMessages.push({
            sender,
            message,
            timestamp: new Date(),
            read: false
        });

        await attempt.save();

        return NextResponse.json({
            message: 'Message sent successfully',
            success: true
        });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json(
            { message: 'Failed to send message', error: error.message },
            { status: 500 }
        );
    }
}

// Get chat messages
export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const attemptId = searchParams.get('attemptId');

        if (!attemptId) {
            return NextResponse.json(
                { message: 'Missing attemptId' },
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

        return NextResponse.json({
            messages: attempt.chatMessages || [],
            chatBlocked: attempt.chatBlocked || false,
            success: true
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json(
            { message: 'Failed to fetch messages', error: error.message },
            { status: 500 }
        );
    }
}
