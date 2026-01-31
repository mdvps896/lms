import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Exam from '@/models/Exam'
import ExamAttempt from '@/models/ExamAttempt'
import { getAuthenticatedUser } from '@/utils/apiAuth'

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const examId = searchParams.get('examId')
        const userId = searchParams.get('userId')
        const currentUser = await getAuthenticatedUser(request)

        if (!currentUser) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        if (!examId || !userId) {
            return NextResponse.json(
                { message: 'Exam ID and User ID are required' },
                { status: 400 }
            )
        }

        // Security: Students can only check their own attempts, unless admin/teacher
        if (currentUser.role !== 'admin' && currentUser.role !== 'teacher' && currentUser.id !== userId && currentUser._id?.toString() !== userId) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        // Verify exam exists
        const exam = await Exam.findById(examId)
        if (!exam) {
            return NextResponse.json(
                { message: 'Exam not found' },
                { status: 404 }
            )
        }

        // Query ExamAttempt collection for completed attempts
        const completedAttempts = await ExamAttempt.find({
            exam: examId,
            user: userId,
            status: { $in: ['submitted', 'expired'] }
        }).sort({ startedAt: -1 })

        // Check for active attempt (not submitted)
        const activeAttempt = await ExamAttempt.findOne({
            exam: examId,
            user: userId,
            status: 'active',
            isActive: true
        })

        return NextResponse.json({
            attempts: completedAttempts.length,
            hasActiveAttempt: !!activeAttempt,
            activeAttemptId: activeAttempt?._id,
            lastAttempt: completedAttempts[0] || null
        })

    } catch (error) {
        console.error('Error checking attempts:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}