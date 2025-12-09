import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';

export async function POST() {
    try {
        await connectDB();

        console.log('Cleaning up stale exam attempts...');

        // Find all active attempts
        const activeAttempts = await ExamAttempt.find({
            status: 'active',
            isActive: true
        }).populate('exam', 'duration');

        console.log('Found active attempts:', activeAttempts.length);

        let expiredCount = 0;

        for (const attempt of activeAttempts) {
            if (!attempt.exam) {
                console.log('No exam found for attempt:', attempt._id);
                continue;
            }

            // Calculate expected end time
            const startTime = new Date(attempt.startedAt);
            const duration = attempt.exam.duration * 60 * 1000; // Convert to milliseconds
            const expectedEndTime = new Date(startTime.getTime() + duration);
            const now = new Date();

            // If current time is past expected end time, mark as submitted
            if (now > expectedEndTime) {
                console.log(`Auto-submitting attempt ${attempt._id} - Started: ${startTime}, Expected End: ${expectedEndTime}, Now: ${now}`);
                
                attempt.status = 'submitted';
                attempt.isActive = false;
                attempt.submittedAt = expectedEndTime;
                
                // Calculate score if not already calculated
                if (attempt.score === undefined || attempt.score === null) {
                    // TODO: Calculate score based on answers
                    attempt.score = 0;
                    attempt.totalMarks = 0;
                    attempt.percentage = 0;
                }
                
                await attempt.save();
                expiredCount++;
            }
        }

        console.log(`Cleaned up ${expiredCount} expired attempts`);

        return NextResponse.json({
            message: 'Cleanup completed',
            expiredCount,
            totalChecked: activeAttempts.length
        });
    } catch (error) {
        console.error('Error cleaning up attempts:', error);
        return NextResponse.json(
            { message: 'Failed to cleanup attempts', error: error.message },
            { status: 500 }
        );
    }
}
