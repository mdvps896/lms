import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exam from '@/models/Exam';
import ExamAttempt from '@/models/ExamAttempt';


export async function GET(request, { params }) {
    try {
        await dbConnect();

        const { examId } = params;

        console.log('Fetching attempts for exam:', examId);

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
                    console.log('User ID:', userId);
                } catch (parseError) {
                    console.error('Failed to parse user cookie:', parseError);
                }
            }
        }

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'User not authenticated' },
                { status: 401 }
            );
        }

        // Get exam details
        const exam = await Exam.findById(examId)
            .populate('subjects')
            .lean();

        if (!exam) {
            console.error('Exam not found:', examId);
            return NextResponse.json(
                { success: false, message: 'Exam not found' },
                { status: 404 }
            );
        }

        console.log('Exam found:', exam.name);

        // Fetch attempts from ExamAttempt collection
        const examAttempts = await ExamAttempt.find({
            exam: examId,
            user: userId
        }).lean();

        console.log('ExamAttempt collection attempts:', examAttempts.length);

        let userAttempts = examAttempts;

        // Calculate total questions from questionGroups count
        let totalQuestions = 0;
        if (exam.questionGroups && Array.isArray(exam.questionGroups)) {
            totalQuestions = exam.questionGroups.length;
        }

        // Format attempts for response
        const formattedAttempts = userAttempts.map(attempt => {
            // Use percentage if available, otherwise calculate from score
            let score = 0;
            if (attempt.percentage !== undefined && attempt.percentage !== null) {
                score = attempt.percentage;
            } else if (attempt.totalMarks > 0 && attempt.score !== undefined && attempt.score !== null) {
                score = (attempt.score / attempt.totalMarks) * 100;
            }

            const passed = (attempt.totalMarks > 0 && attempt.score !== undefined && attempt.score !== null)
                ? score >= exam.passingPercentage
                : false;

            let timeTaken = null;
            if (attempt.submittedAt && attempt.startedAt) {
                try {
                    timeTaken = Math.floor((new Date(attempt.submittedAt) - new Date(attempt.startedAt)) / 1000);
                } catch (e) {
                    console.error('Error calculating time:', e);
                }
            }
            
            console.log('Attempt', attempt._id, '- Score:', attempt.score, '/', attempt.totalMarks, '=', score.toFixed(2) + '%', 'Status:', attempt.status);

            return {
                _id: attempt._id,
                score,
                passed,
                resultStatus: attempt.resultStatus || 'published',
                hasSubjectiveQuestions: attempt.hasSubjectiveQuestions || false,
                timeTaken,
                submittedAt: attempt.submittedAt,
                createdAt: attempt.startedAt,
                status: attempt.status
            };
        });

        const response = {
            success: true,
            exam: {
                _id: exam._id,
                title: exam.name,
                subject: exam.subjects && exam.subjects.length > 0 ? exam.subjects[0] : null,
                duration: exam.duration,
                totalQuestions
            },
            attempts: formattedAttempts
        };

        console.log('Returning response with', formattedAttempts.length, 'attempts');

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching exam attempts:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch exam attempts', error: error.message },
            { status: 500 }
        );
    }
}
