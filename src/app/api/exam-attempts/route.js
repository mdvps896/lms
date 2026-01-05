import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ExamAttempt from '@/models/ExamAttempt';
import Exam from '@/models/Exam';
import Question from '@/models/Question';
import { cookies } from 'next/headers';
import { verifyToken } from '@/utils/auth';

export async function POST(req) {
    try {
        await dbConnect();

        const body = await req.json();
        const { examId, answers, timeTaken, userId } = body;

        let currentUserId = userId;
        let token = null;

        // 🔒 SECURITY: Try to get User ID from Token first (Verified Source)
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else {
            const tokenCookie = req.cookies.get('token');
            if (tokenCookie) token = tokenCookie.value;
        }

        if (token) {
            const payload = await verifyToken(token);
            if (payload && payload.userId) {
                currentUserId = payload.userId;
            }
        }

        // Fallback to legacy/web cookie
        if (!currentUserId) {
            const cookieStore = cookies();
            const userCookie = cookieStore.get('currentUser') || cookieStore.get('user');
            if (userCookie) {
                try {
                    const u = JSON.parse(userCookie.value);
                    currentUserId = u.id || u._id;
                } catch (e) { }
            }
        }

        if (!currentUserId) {
            return NextResponse.json({
                success: false,
                error: 'User not authenticated'
            }, { status: 401 });
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

                // MCQ / TrueFalse logic
                if (['mcq', 'true_false', 'multiple_choice'].includes(question.type)) {
                    // Check if userAnswer matches strict correct option
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

        console.log(`🔒 Secure Scoring - User: ${currentUserId}, Exam: ${examId}, Score: ${calculatedScore}/${totalExamMarks}, Passed: ${passed}`);

        // Create exam attempt
        const examAttempt = await ExamAttempt.create({
            user: currentUserId,
            exam: examId,
            sessionToken,
            answers: answers || {},
            score: calculatedScore,
            totalMarks: totalExamMarks,
            percentage,
            timeTaken: Number(timeTaken) || 0,
            passed: passed,
            status: 'submitted',
            submittedAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            data: examAttempt
        });
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
        let currentUserId = searchParams.get('userId');

        // 🔒 SECURITY: Verify Token
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = await verifyToken(token);
            if (payload && payload.userId) {
                currentUserId = payload.userId;
            }
        }

        if (!currentUserId) {
            const cookieStore = cookies();
            const sessionUser = cookieStore.get('currentUser') || cookieStore.get('user');
            if (sessionUser) {
                try {
                    const u = JSON.parse(sessionUser.value);
                    currentUserId = u.id || u._id;
                } catch (e) { }
            }
        }

        if (!currentUserId) {
            // For Admin? Admins might list all attempts.
            // If no user ID but Admin token?
            // For now, restrictive to user.
            return NextResponse.json({
                success: false,
                error: 'User not authenticated'
            }, { status: 401 });
        }

        const attempts = await ExamAttempt.find({ user: currentUserId })
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
