import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exam from '@/models/Exam';
import ExamAttempt from '@/models/ExamAttempt';

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

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'User not authenticated' },
                { status: 401 }
            );
        }

        console.log('Fetching results for user:', userId);

        // Get all submitted exam attempts for this user
        const examAttempts = await ExamAttempt.find({
            user: userId,
            status: 'submitted'
        })
            .populate({
                path: 'exam',
                populate: [
                    { path: 'category' },
                    { path: 'subjects' }
                ]
            })
            .sort({ submittedAt: -1 })
            .lean();

        console.log('Found exam attempts:', examAttempts.length);

        // Group attempts by exam
        const examMap = new Map();
        
        examAttempts.forEach(attempt => {
            if (!attempt.exam) return;
            
            const examId = attempt.exam._id.toString();
            
            if (!examMap.has(examId)) {
                examMap.set(examId, {
                    exam: attempt.exam,
                    attempts: []
                });
            }
            
            examMap.get(examId).attempts.push(attempt);
        });

        // Process exams to create results
        const examResults = Array.from(examMap.values()).map(({ exam, attempts }) => {
            // Get last attempt
            const lastAttempt = attempts[0]; // Already sorted by submittedAt desc

            return {
                _id: exam._id,
                title: exam.name,
                subject: exam.subjects && exam.subjects.length > 0 ? exam.subjects[0] : null,
                duration: exam.duration,
                totalQuestions: exam.questionGroups ? exam.questionGroups.length : 0,
                totalAttempts: attempts.length,
                lastAttempt: {
                    score: lastAttempt.percentage || 0,
                    passed: lastAttempt.resultStatus === 'published' ? lastAttempt.percentage >= exam.passingPercentage : null,
                    resultStatus: lastAttempt.resultStatus || 'draft',
                    hasSubjectiveQuestions: lastAttempt.hasSubjectiveQuestions || false,
                    createdAt: lastAttempt.submittedAt,
                    rawScore: lastAttempt.score,
                    rawTotalMarks: lastAttempt.totalMarks
                }
            };
        });

        console.log('Returning exam results:', examResults.length);

        return NextResponse.json({
            success: true,
            exams: examResults
        });

    } catch (error) {
        console.error('Error fetching student results:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch results', error: error.message },
            { status: 500 }
        );
    }
}
