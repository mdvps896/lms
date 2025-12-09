import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/models/Exam'

export async function POST(request) {
    try {
        await connectDB()

        const { attemptId, questionId, answer, sessionToken, examId } = await request.json()

        console.log('Save answer request:', { attemptId, questionId, answer: answer ? 'provided' : 'empty', examId });

        if (!attemptId || !questionId || !sessionToken || !examId) {
            console.error('Missing required fields');
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Get exam with attempts
        const exam = await Exam.findById(examId)

        if (!exam) {
            console.error('Exam not found:', examId);
            return NextResponse.json(
                { message: 'Exam not found' },
                { status: 404 }
            )
        }

        // Find the attempt
        const attempt = exam.attempts.id(attemptId)

        if (!attempt) {
            console.error('Attempt not found:', attemptId);
            return NextResponse.json(
                { message: 'Attempt not found' },
                { status: 404 }
            )
        }

        if (attempt.sessionToken !== sessionToken) {
            console.error('Invalid session token');
            return NextResponse.json(
                { message: 'Invalid session token' },
                { status: 403 }
            )
        }

        // Don't allow saving if already submitted
        if (attempt.status === 'submitted') {
            console.error('Exam already submitted');
            return NextResponse.json(
                { message: 'Exam already submitted' },
                { status: 400 }
            )
        }

        // Check if time hasn't expired (only if endTime is set)
        if (attempt.endTime) {
            const now = new Date()
            if (now > attempt.endTime) {
                console.log('Exam time expired');
                attempt.status = 'expired'
                attempt.isActive = false
                await exam.save()

                return NextResponse.json(
                    { message: 'Exam time has expired' },
                    { status: 400 }
                )
            }
        }

        // Update answer
        console.log('Saving answer for question:', questionId);
        console.log('Answer type:', Array.isArray(answer) ? 'array' : typeof answer);
        console.log('Answer value:', answer);
        
        attempt.answers.set(questionId, answer)
        
        // Mark the nested field as modified to ensure Mongoose saves it
        exam.markModified('attempts')
        
        await exam.save()

        console.log('Answer saved successfully');

        return NextResponse.json({
            message: 'Answer saved successfully',
            questionId,
            answer,
            timestamp: new Date()
        })

    } catch (error) {
        console.error('Error saving answer:', error)
        console.error('Error stack:', error.stack)
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        )
    }
}
