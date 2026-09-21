import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';
import Exam from '@/models/Exam';
import Question from '@/models/Question';
import { getAuthenticatedUser } from '@/utils/apiAuth';
import crypto from 'crypto';

export async function POST(req) {
    try {
        await dbConnect();

        const body = await req.json();
        const { examId, answers, timeTaken, userId, isFreeMaterial } = body;
        const currentUser = await getAuthenticatedUser(req);

        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Security: Students can only submit for themselves, unless admin
        const targetUserId = userId || currentUser.id;
        if (currentUser.role !== 'admin' && targetUserId !== currentUser.id && targetUserId !== currentUser._id?.toString()) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        // Unguessable session token (the old value was Date.now() + Math.random()).
        const sessionToken = `session_${crypto.randomUUID()}`;

        // 🔒 SECURITY: Server-side Scoring
        const exam = await Exam.findById(examId);
        if (!exam) {
            return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
        }

        // 🔒 SECURITY: this endpoint creates a fresh submitted attempt out of
        // thin air. It enforced neither the exam window nor maxAttempts —
        // unlike /exams/start-session — so a student could submit unlimited
        // attempts, before the exam opened or long after it closed, and keep
        // the best score. Staff (admin/teacher) are exempt so they can still
        // record attempts manually.
        const isStaff = currentUser.role === 'admin' || currentUser.role === 'teacher';

        if (!isStaff && !isFreeMaterial) {
            const now = new Date();
            if ((exam.startDate && now < exam.startDate) || (exam.endDate && now > exam.endDate)) {
                return NextResponse.json(
                    { success: false, error: 'Exam is not currently active' },
                    { status: 400 }
                );
            }

            const maxAttempts = exam.maxAttempts || -1;
            if (maxAttempts !== -1) {
                const usedAttempts = await ExamAttempt.countDocuments({
                    exam: examId,
                    user: targetUserId,
                    status: 'submitted'
                });
                if (usedAttempts >= maxAttempts) {
                    return NextResponse.json(
                        { success: false, error: 'You have exceeded the maximum number of attempts for this exam' },
                        { status: 400 }
                    );
                }
            }
        }

        // Fetch valid questions. Exams built from subjects rather than question
        // groups used to yield an empty set here, making totalExamMarks 0 and
        // failing every candidate with 0%.
        let questions = [];
        if (exam.questionGroups && exam.questionGroups.length > 0) {
            questions = await Question.find({
                questionGroup: { $in: exam.questionGroups },
                status: 'active'
            });
        } else if (exam.subjects && exam.subjects.length > 0) {
            questions = await Question.find({
                subject: { $in: exam.subjects },
                status: 'active'
            });
        }

        // Calculate Score
        let calculatedScore = 0;
        let totalExamMarks = 0;
        let correctCount = 0;

        for (const question of questions) {
            totalExamMarks += (question.marks || 0);

            const userAnswer = answers && answers[question._id.toString()];

            if (userAnswer !== undefined && userAnswer !== null) {
                let isCorrect = false;

                // Written answers are graded manually later; only auto-score
                // the objective types here.
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
                    correctCount++;
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
                isFreeMaterial: isFreeMaterial || false,
            });

            return NextResponse.json({
                success: true,
                data: {
                    ...examAttempt.toObject(),
                    // Clients render the result screen from these; they must
                    // never need the answer key to do it.
                    correctCount,
                    totalQuestions: questions.length
                }
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
