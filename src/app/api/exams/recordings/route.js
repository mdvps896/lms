import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamAttempt from '@/models/ExamAttempt'
import Exam from '@/models/Exam'
import User from '@/models/User'

export async function GET(request) {
    try {
        await connectDB()
        
        const { searchParams } = new URL(request.url)
        const attemptId = searchParams.get('attemptId')
        const examId = searchParams.get('examId')
        const userId = searchParams.get('userId')
        
        let recordings = []
        
        if (attemptId) {
            // Get recordings for specific attempt
            const attempt = await ExamAttempt.findById(attemptId)
                .populate('user', 'name email')
                .populate('exam', 'name')
                .lean()
            
            if (attempt && attempt.recordings) {
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
            
            // Also check embedded attempts in Exam collection
            if (recordings.length === 0) {
                const exams = await Exam.find({
                    'attempts._id': attemptId
                }).lean()
                
                for (const exam of exams) {
                    const attempt = exam.attempts.find(a => a._id.toString() === attemptId)
                    if (attempt && attempt.recordings) {
                        const user = await User.findById(attempt.userId).select('name email').lean()
                        const userName = user?.name || 'Unknown User'
                        
                        if (attempt.recordings.cameraVideo) {
                            recordings.push({
                                type: 'camera',
                                url: attempt.recordings.cameraVideo,
                                filename: `Camera-${exam.name}-${userName}-${attempt._id}.webm`,
                                attemptId: attempt._id,
                                examName: exam.name,
                                studentName: userName,
                                recordedAt: attempt.submittedAt || attempt.startTime
                            })
                        }
                        
                        if (attempt.recordings.screenVideo) {
                            recordings.push({
                                type: 'screen',
                                url: attempt.recordings.screenVideo,
                                filename: `Screen-${exam.name}-${userName}-${attempt._id}.webm`,
                                attemptId: attempt._id,
                                examName: exam.name,
                                studentName: userName,
                                recordedAt: attempt.submittedAt || attempt.startTime
                            })
                        }
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