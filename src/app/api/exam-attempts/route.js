import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';
import Exam from '@/models/Exam';
import Question from '@/models/Question';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export async function POST(req) {
    try {
        await dbConnect();

        const body = await req.json();
        const { examId, answers, timeTaken, userId } = body;
        const currentUser = await getAuthenticatedUser(req);

        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Security: Students can only submit for themselves, unless admin
        const targetUserId = userId || currentUser.id;
        if (currentUser.role !== 'admin' && targetUserId !== currentUser.id && targetUserId !== currentUser._id?.toString()) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        // Generate unique session token
        const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // 🔒 SECURITY: Server-side Scoring
        const exam = await Exam.findById(examId);
        if (!exam) {
            return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
        }

        // Fetch valid questions
        const questions = await Question.find({
            questionGroup: { $in: exam.questionGroups },
            status: 'active'
        });

        // Calculate Score
        let calculatedScore = 0;
        let totalExamMarks = 0;

        for (const question of questions) {
            totalExamMarks += (question.marks || 0);

            const userAnswer = answers && answers[question._id.toString()];

            if (userAnswer !== undefined && userAnswer !== null) {
                let isCorrect = false;

                if (['mcq', 'true_false', 'multiple_choice'].includes(question.type)) {
                    if (typeof userAnswer === 'number') {
                        const option = question.options[userAnswer];
                        if (option && option.isCorrect) isCorrect = true;
                    }
                    else if (typeof userAnswer === 'string') {
                        const optionById = question.options.find(o => o._id && o._id.toString() === userAnswer);
                        if (optionById && optionById.isCorrect) isCorrect = true;

                        if (!isCorrect) {
                            const optionByText = question.options.find(o => o.text === userAnswer);
                            if (optionByText && optionByText.isCorrect) isCorrect = true;
                        }
                    }
                }

                if (isCorrect) {
                    calculatedScore += (question.marks || 0);
                }
            }
        }

        // Determine Pass/Fail
        const passCriteria = Number(exam.passingPercentage) || 40;
        const percentage = totalExamMarks > 0 ? (calculatedScore / totalExamMarks * 100) : 0;
        const passed = percentage >= passCriteria;

        // Create exam attempt
        try {
            const submittedAt = new Date();
            const timeTakenSec = Number(timeTaken) || 0;
            const startedAt = new Date(submittedAt.getTime() - (timeTakenSec * 1000));

            const examAttempt = await ExamAttempt.create({
                user: targetUserId,
                exam: examId,
                sessionToken,
                answers: answers || {},
                score: calculatedScore,
                totalMarks: totalExamMarks,
                percentage,
                timeTaken: timeTakenSec,
                passed: passed,
                status: 'submitted',
                startedAt: startedAt,
                submittedAt: submittedAt,
            });

            return NextResponse.json({
                success: true,
                data: examAttempt
            });
        } catch (createError) {
            console.error('❌ Error creating exam attempt in database:', createError);
            throw createError;
        }
    } catch (error) {
        console.error('❌ Error creating exam attempt:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const currentUser = await getAuthenticatedUser(req);

        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Security: Students can only list their own attempts, unless admin/teacher
        const targetUserId = userId || currentUser.id;
        if (currentUser.role !== 'admin' && currentUser.role !== 'teacher' && targetUserId !== currentUser.id && targetUserId !== currentUser._id?.toString()) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const attempts = await ExamAttempt.find({ user: targetUserId })
            .populate('exam', 'name category')
            .sort({ submittedAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            data: attempts
        });
    } catch (error) {
        console.error('❌ Error fetching exam attempts:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
