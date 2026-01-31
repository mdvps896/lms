import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamAttempt from '@/models/ExamAttempt'
import Exam from '@/models/Exam'
import User from '@/models/User'
import { getAuthenticatedUser } from '@/utils/apiAuth'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

export async function GET(request) {
    try {
        await connectDB()

        const url = new URL(request.url)
        const { searchParams } = url
        const attemptId = searchParams.get('attemptId')
        const examId = searchParams.get('examId')
        const userId = searchParams.get('userId')
        const currentUser = await getAuthenticatedUser(request)

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        // Security: Students can only access their own recordings, unless admin/teacher
        const targetUserId = userId || (attemptId ? null : currentUser.id);
        if (currentUser.role !== 'admin' && currentUser.role !== 'teacher') {
            if (targetUserId && targetUserId !== currentUser.id && targetUserId !== currentUser._id?.toString()) {
                return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
            }
        }

        let recordings = []

        if (attemptId) {
            // Get recordings for specific attempt
            const attempt = await ExamAttempt.findById(attemptId)
                .populate('user', 'name email')
                .populate('exam', 'name')
                .lean()

            if (attempt) {
                // Check ownership if not admin/teacher
                if (currentUser.role !== 'admin' && currentUser.role !== 'teacher' && attempt.user?.toString() !== currentUser.id && attempt.user?._id?.toString() !== currentUser.id) {
                    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
                }

                if (attempt.recordings) {
                    const user = attempt.user || { name: 'Unknown User', email: 'N/A' }
                    const exam = attempt.exam || { name: 'Unknown Exam' }

                    if (attempt.recordings.cameraVideo) {
                        recordings.push({
                            type: 'camera',
                            url: attempt.recordings.cameraVideo,
                            filename: `Camera-${exam.name}-${user.name}-${attempt._id}.webm`,
                            attemptId: attempt._id,
                            examName: exam.name,
                            studentName: user.name,
                            recordedAt: attempt.createdAt
                        })
                    }

                    if (attempt.recordings.screenVideo) {
                        recordings.push({
                            type: 'screen',
                            url: attempt.recordings.screenVideo,
                            filename: `Screen-${exam.name}-${user.name}-${attempt._id}.webm`,
                            attemptId: attempt._id,
                            examName: exam.name,
                            studentName: user.name,
                            recordedAt: attempt.createdAt
                        })
                    }
                }
            }
        } else if (examId && userId) {
            // Get recordings for specific user and exam
            const attempts = await ExamAttempt.find({
                exam: examId,
                user: userId
            })
                .populate('user', 'name email')
                .populate('exam', 'name')
                .lean()

            for (const attempt of attempts) {
                if (attempt.recordings) {
                    const user = attempt.user || { name: 'Unknown User', email: 'N/A' }
                    const exam = attempt.exam || { name: 'Unknown Exam' }

                    if (attempt.recordings.cameraVideo) {
                        recordings.push({
                            type: 'camera',
                            url: attempt.recordings.cameraVideo,
                            filename: `Camera-${exam.name}-${user.name}-${attempt._id}.webm`,
                            attemptId: attempt._id,
                            examName: exam.name,
                            studentName: user.name,
                            recordedAt: attempt.createdAt
                        })
                    }

                    if (attempt.recordings.screenVideo) {
                        recordings.push({
                            type: 'screen',
                            url: attempt.recordings.screenVideo,
                            filename: `Screen-${exam.name}-${user.name}-${attempt._id}.webm`,
                            attemptId: attempt._id,
                            examName: exam.name,
                            studentName: user.name,
                            recordedAt: attempt.createdAt
                        })
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            recordings: recordings,
            count: recordings.length
        })

    } catch (error) {
        console.error('Error fetching exam recordings:', error)
        return NextResponse.json(
            { success: false, message: 'Error fetching recordings', error: error.message },
            { status: 500 }
        )
    }
}