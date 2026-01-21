import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/models/Exam'
import ExamAttempt from '@/models/ExamAttempt'

export async function POST(request) {
    try {
        await connectDB()

        const { attemptId, questionId, answer, sessionToken, examId } = await request.json()

        if (!attemptId || !questionId || !sessionToken || !examId) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            )
        }

        // 1. Try to find in independent ExamAttempt collection first
        let attempt = await ExamAttempt.findById(attemptId);
        let isIndependentAttempt = !!attempt;

        // 2. If not found, check embedded in Exam
        let exam = null;
        let embeddedAttempt = null;

        if (!attempt) {
            exam = await Exam.findById(examId);
            if (!exam) {
                return NextResponse.json(
                    { message: 'Exam not found' },
                    { status: 404 }
                )
            }
            embeddedAttempt = exam.attempts.id(attemptId);

            if (!embeddedAttempt) {
                return NextResponse.json(
                    { message: 'Attempt not found' },
                    { status: 404 }
                )
            }
            attempt = embeddedAttempt;
        }

        // Validate session token
        if (attempt.sessionToken !== sessionToken) {
            return NextResponse.json(
                { message: 'Invalid session token' },
                { status: 403 }
            )
        }

        // Don't allow saving if already submitted
        if (attempt.status === 'submitted') {
            return NextResponse.json(
                { message: 'Exam already submitted' },
                { status: 400 }
            )
        }

        // Check if time hasn't expired (only if endTime is set)
        if (attempt.endTime) {
            const now = new Date()
            if (now > attempt.endTime) {
                attempt.status = 'expired';
                attempt.isActive = false;

                if (isIndependentAttempt) {
                    await attempt.save();
                } else {
                    await exam.save();
                }

                return NextResponse.json(
                    { message: 'Exam time has expired' },
                    { status: 400 }
                )
            }
        }

        // Update answer
        if (isIndependentAttempt) {
            // Update ExamAttempt document
            if (!attempt.answers) {
                attempt.answers = new Map();
            }
            attempt.answers.set(questionId, answer);
            await attempt.save();
        } else {
            // Update embedded attempt
            attempt.answers.set(questionId, answer);
            exam.markModified('attempts');
            await exam.save();
        }

        // If we updated independent attempt, we might also want to update embedded if it exists (for sync)
        if (isIndependentAttempt) {
            try {
                // Try to find exam and update embedded attempt too if exists
                if (!exam) exam = await Exam.findById(examId);
                if (exam) {
                    const linkedAttempt = exam.attempts.id(attemptId);
                    if (linkedAttempt) {
                        linkedAttempt.answers.set(questionId, answer);
                        exam.markModified('attempts');
                        await exam.save();
                    }
                }
            } catch (err) {
                console.error('Error syncing embedded attempt:', err);
                // Continue, as primary save succeeded
            }
        }

        return NextResponse.json({
            message: 'Answer saved successfully',
            questionId,
            answer: answer, // Return actual answer
            timestamp: new Date()
        })

    } catch (error) {
        console.error('Error saving answer:', error)
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        )
    }
}
