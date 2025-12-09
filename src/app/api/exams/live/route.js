import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();

        // Find all active exam attempts
        const activeAttempts = await ExamAttempt.find({
            status: 'active',
            isActive: true
        })
            .populate('user', 'name email profileImage photo')
            .populate('exam', 'name duration')
            .lean();

        // Group by exam
        const examGroups = {};

        for (const attempt of activeAttempts) {
            if (!attempt.exam) continue;

            const examId = attempt.exam._id.toString();
            const examName = attempt.exam.name;
            const examDuration = attempt.exam.duration;

            if (!examGroups[examId]) {
                examGroups[examId] = {
                    _id: examId,
                    examName: examName,
                    activeUsers: []
                };
            }

            // Calculate time remaining
            const startTime = new Date(attempt.startedAt);
            const duration = examDuration * 60 * 1000; // Convert to milliseconds
            const elapsed = Date.now() - startTime.getTime();
            const remaining = Math.max(0, duration - elapsed);
            const remainingMinutes = Math.floor(remaining / 60000);
            const remainingSeconds = Math.floor((remaining % 60000) / 1000);

            // Calculate progress
            const progress = Math.min(100, (elapsed / duration) * 100);

            examGroups[examId].activeUsers.push({
                attemptId: attempt._id.toString(),
                userId: attempt.user?._id?.toString() || '',
                userName: attempt.user?.name || 'Unknown User',
                userEmail: attempt.user?.email || '',
                userPhoto: attempt.user?.profileImage || attempt.user?.photo || '/images/default-avatar.png',
                timeRemaining: `${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`,
                progress: progress.toFixed(0),
                startedAt: attempt.startedAt
            });
        }

        const liveExams = Object.values(examGroups);

        return NextResponse.json({
            liveExams,
            totalActive: liveExams.reduce((sum, exam) => sum + exam.activeUsers.length, 0)
        });
    } catch (error) {
        console.error('Error fetching live exams:', error);
        return NextResponse.json(
            { message: 'Failed to fetch live exams', error: error.message },
            { status: 500 }
        );
    }
}
