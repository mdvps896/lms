import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exam from '@/models/Exam';
import ExamAttempt from '@/models/ExamAttempt';
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
            const lastAttempt = attempts[0];

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

        return NextResponse.json({
            success: true,
            exams: examResults
        });

    } catch (error) {
        console.error('Error fetching student results:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch results', error: error.message },
            { status: 500 }
        );
    }
}
