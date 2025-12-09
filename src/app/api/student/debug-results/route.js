import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exam from '@/models/Exam';

export async function GET(request) {
    try {
        await dbConnect();

        // Get user ID from cookies
        const cookies = request.headers.get('cookie');
        let userId = null;

        if (cookies) {
            const userCookie = cookies
                .split('; ')
                .find(row => row.startsWith('user='));

            if (userCookie) {
                try {
                    const userDataStr = decodeURIComponent(userCookie.split('=')[1]);
                    const userData = JSON.parse(userDataStr);
                    userId = userData._id;
                } catch (parseError) {
                    console.error('Failed to parse user cookie:', parseError);
                }
            }
        }

        // Get all exams
        const allExams = await Exam.find({}).select('name attempts').lean();

        // Count exams with attempts
        const examsWithAttempts = allExams.filter(exam => exam.attempts && exam.attempts.length > 0);

        // Get user's exams
        const userExams = userId ? allExams.filter(exam =>
            exam.attempts && exam.attempts.some(attempt => attempt.userId && attempt.userId.toString() === userId)
        ) : [];

        return NextResponse.json({
            success: true,
            debug: {
                userId,
                totalExams: allExams.length,
                examsWithAttempts: examsWithAttempts.length,
                userExams: userExams.length,
                userExamDetails: userExams.map(exam => ({
                    name: exam.name,
                    attemptCount: exam.attempts.filter(a => a.userId && a.userId.toString() === userId).length
                }))
            }
        });

    } catch (error) {
        console.error('Debug error:', error);
        return NextResponse.json(
            { success: false, message: error.message, stack: error.stack },
            { status: 500 }
        );
    }
}
