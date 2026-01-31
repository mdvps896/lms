import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exam from '@/models/Exam';
import ExamAttempt from '@/models/ExamAttempt';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { examId } = params;
        const currentUser = await getAuthenticatedUser(request);

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const userId = currentUser.id || currentUser._id?.toString();

        const exam = await Exam.findById(examId)
            .populate('subjects')
            .lean();

        if (!exam) {
            return NextResponse.json({ success: false, message: 'Exam not found' }, { status: 404 });
        }

        const examAttempts = await ExamAttempt.find({
            exam: examId,
            user: userId
        }).lean();

        let totalQuestions = 0;
        if (exam.questionGroups && Array.isArray(exam.questionGroups)) {
            totalQuestions = exam.questionGroups.length;
        }

        const formattedAttempts = examAttempts.map(attempt => {
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
                } catch (e) { }
            }

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

        return NextResponse.json({
            success: true,
            exam: {
                _id: exam._id,
                title: exam.name,
                subject: exam.subjects && exam.subjects.length > 0 ? exam.subjects[0] : null,
                duration: exam.duration,
                totalQuestions
            },
            attempts: formattedAttempts
        });

    } catch (error) {
        console.error('Error fetching exam attempts:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch exam attempts', error: error.message },
            { status: 500 }
        );
    }
}
