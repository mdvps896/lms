import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exam from '@/models/Exam';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await dbConnect();
        const currentUser = await getAuthenticatedUser(request);

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const userId = currentUser.id || currentUser._id?.toString();

        // Get all exams
        const allExams = await Exam.find({}).select('name attempts').lean();

        // Count exams with attempts
        const examsWithAttempts = allExams.filter(exam => exam.attempts && exam.attempts.length > 0);

        // Get user's exams
        const userExams = allExams.filter(exam =>
            exam.attempts && exam.attempts.some(attempt => (attempt.userId && attempt.userId.toString() === userId) || (attempt.user && attempt.user.toString() === userId))
        );

        return NextResponse.json({
            success: true,
            debug: {
                userId,
                totalExams: allExams.length,
                examsWithAttempts: examsWithAttempts.length,
                userExams: userExams.length,
                userExamDetails: userExams.map(exam => ({
                    name: exam.name,
                    attemptCount: exam.attempts.filter(a => (a.userId && a.userId.toString() === userId) || (a.user && a.user.toString() === userId)).length
                }))
            }
        });

    } catch (error) {
        console.error('Debug error:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
