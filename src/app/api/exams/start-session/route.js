import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/models/Exam'
import User from '@/models/User'
import ExamAttempt from '@/models/ExamAttempt'
import { getAuthenticatedUser } from '@/utils/apiAuth'

export async function POST(request) {
    try {
        await connectDB()

        const currentUser = getAuthenticatedUser(request);
        if (!currentUser) {
            return NextResponse.json(
                { message: 'Unauthorized: Login required' },
                { status: 401 }
            )
        }

        const { examId, userId, verificationId } = await request.json()

        if (!examId || !userId) {
            return NextResponse.json(
                { message: 'Exam ID and User ID are required' },
                { status: 400 }
            )
        }

        // Security Check: Ensure user is starting session for themselves
        const currentUserId = currentUser.id || currentUser._id;
        if (userId !== currentUserId) {
            return NextResponse.json(
                { message: 'Unauthorized: Cannot start exam for another user' },
                { status: 403 }
            )
        }

        // Validate exam exists and is active
        const exam = await Exam.findById(examId).populate('subjects category')
        if (!exam) {
            return NextResponse.json(
                { message: 'Exam not found' },
                { status: 404 }
            )
        }

        // Check if exam is currently active
        const now = new Date()
        if (now < exam.startDate || now > exam.endDate) {
            return NextResponse.json(
                { message: 'Exam is not currently active' },
                { status: 400 }
            )
        }

        // Validate user exists
        const user = await User.findById(userId)
        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            )
        }

        // Check user's category matches exam category
        if (user.category.toString() !== exam.category._id.toString()) {
            return NextResponse.json(
                { message: 'You are not authorized to take this exam' },
                { status: 403 }
            )
        }

        // Check if user has remaining attempts (only if maxAttempts is not -1 for unlimited)
        const userAttempts = exam.attempts.filter(attempt =>
            attempt.userId.toString() === userId &&
            ['submitted', 'expired'].includes(attempt.status)
        )

        const maxAttempts = exam.maxAttempts || -1
        if (maxAttempts !== -1 && userAttempts.length >= maxAttempts) {
            return NextResponse.json(
                { message: 'You have exceeded the maximum number of attempts for this exam' },
                { status: 400 }
            )
        }

        // Check for active session in ExamAttempt model
        let activeExamAttempt = await ExamAttempt.findOne({
            exam: examId,
            user: userId,
            status: 'active'
        })

        // If verificationId is provided, use that ExamAttempt
        if (verificationId && !activeExamAttempt) {
            activeExamAttempt = await ExamAttempt.findById(verificationId)

            if (activeExamAttempt) {
                // Update the attempt to active status
                activeExamAttempt.status = 'active'
                activeExamAttempt.startedAt = now
                activeExamAttempt.endTime = new Date(now.getTime() + exam.duration * 60 * 1000)
                await activeExamAttempt.save()
            }
        }

        if (activeExamAttempt) {
            // Return existing session
            return NextResponse.json({
                session: {
                    token: activeExamAttempt.sessionToken,
                    startedAt: activeExamAttempt.startedAt,
                    examId: exam._id
                },
                attemptId: activeExamAttempt._id,
                message: 'Resuming existing session'
            })
        }

        // Create new session token
        const sessionToken = `${userId}-${examId}-${Date.now()}-${Math.random().toString(36).substring(2)}`

        // Get client info
        const headers = request.headers
        const ipAddress = headers.get('x-forwarded-for') ||
            headers.get('x-real-ip') ||
            'unknown'
        const userAgent = headers.get('user-agent') || 'unknown'

        // Calculate end time based on exam duration
        const endTime = new Date(now.getTime() + exam.duration * 60 * 1000)

        // Create ExamAttempt in the separate model
        const examAttempt = new ExamAttempt({
            exam: examId,
            user: userId,
            sessionToken,
            startedAt: now,
            endTime,
            status: 'active',
            answers: []
        })

        await examAttempt.save()

        // Create new attempt
        const newAttempt = {
            userId,
            sessionToken,
            startedAt: now,
            endTime,
            status: 'active',
            ipAddress,
            userAgent,
            totalMarks: exam.totalMarks,
            answers: new Map(),
            isActive: true,
            recordings: []
        }

        // Add attempt to exam
        exam.attempts.push(newAttempt)

        // Deactivate any other active attempts for this user
        exam.attempts.forEach(attempt => {
            if (attempt.userId.toString() === userId &&
                attempt._id.toString() !== exam.attempts[exam.attempts.length - 1]._id.toString() &&
                attempt.status === 'active') {
                attempt.status = 'expired'
                attempt.isActive = false
            }
        })

        await exam.save()

        return NextResponse.json({
            session: {
                token: sessionToken,
                startedAt: now,
                examId
            },
            attemptId: examAttempt._id,
            message: 'Exam session started successfully'
        })

    } catch (error) {
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}