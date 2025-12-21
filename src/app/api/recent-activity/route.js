
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';
import User from '@/models/User';
import Exam from '@/models/Exam';

export async function GET() {
    try {
        await connectDB();

        // Fetch recent exam attempts
        const attempts = await ExamAttempt.find()
            .populate('user', 'name')
            .populate('exam', 'title')
            .sort({ updatedAt: -1 })
            .limit(10)
            .lean();

        // Fetch recent user registrations
        const newUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // Combine and format
        const activities = [];

        attempts.forEach(attempt => {
            activities.push({
                type: 'exam',
                title: attempt.exam?.title || 'Exam',
                description: `${attempt.user?.name || 'User'} - ${attempt.status}`,
                time: new Date(attempt.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: new Date(attempt.updatedAt)
            });
        });

        newUsers.forEach(user => {
            activities.push({
                type: 'user',
                title: 'New Registration',
                description: `${user.name} joined`,
                time: new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: new Date(user.createdAt)
            });
        });

        // Sort combined list by timestamp descending
        activities.sort((a, b) => b.timestamp - a.timestamp);

        return NextResponse.json({
            success: true,
            activities: activities.slice(0, 10)
        });

    } catch (error) {
        console.error('Error fetching recent activities:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
