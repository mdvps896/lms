import connectDB from '@/lib/mongodb'
import ExamAttempt from '@/models/ExamAttempt'
import Exam from '@/models/Exam'
import { NextResponse } from 'next/server'
import { saveVerificationImage } from '@/utils/saveVerificationImage'
import { getAuthenticatedUser } from '@/utils/apiAuth'

export async function POST(request) {
    try {
        await connectDB()

        const body = await request.json()
        const {
            examId,
            userId,
            verification,
            isAuthorized,
            unauthorizedReason
        } = body
        const currentUser = await getAuthenticatedUser(request)

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        // Validate required fields
        if (!examId || !userId) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields'
            }, { status: 400 })
        }

        // Security: Students can only submit verification for themselves, unless admin
        if (currentUser.role !== 'admin' && currentUser.id !== userId && currentUser._id?.toString() !== userId) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
        }

        // Check if exam exists
        const exam = await Exam.findById(examId)
        if (!exam) {
            return NextResponse.json({
                success: false,
                message: 'Exam not found'
            }, { status: 404 })
        }

        // Save images to file system and get paths
        const processedVerification = { ...verification }

        // Save face verification image
        if (verification?.faceVerification?.selfieImage) {
            try {
                const facePath = saveVerificationImage(
                    verification.faceVerification.selfieImage,
                    'face',
                    userId,
                    examId
                )
                processedVerification.faceVerification.selfieImage = facePath
            } catch (error) {
                console.error('Error saving face image:', error)
            }
        }

        // Save identity verification image
        if (verification?.identityVerification?.identityImage) {
            try {
                const identityPath = saveVerificationImage(
                    verification.identityVerification.identityImage,
                    'identity',
                    userId,
                    examId
                )
                processedVerification.identityVerification.identityImage = identityPath
            } catch (error) {
                console.error('Error saving identity image:', error)
            }
        }

        // Find or create exam attempt
        let examAttempt = await ExamAttempt.findOne({
            exam: examId,
            user: userId,
            status: { $in: ['active', 'not-started'] }
        })

        if (!examAttempt) {
            const sessionToken = `${userId}-${examId}-${Date.now()}`

            examAttempt = new ExamAttempt({
                exam: examId,
                user: userId,
                sessionToken,
                verification: processedVerification,
                status: isAuthorized ? 'active' : 'terminated'
            })

            if (!isAuthorized) {
                examAttempt.warnings.push({
                    message: `Student not authorized: ${unauthorizedReason}`,
                    type: 'system',
                    sentAt: new Date()
                })
            }

            await examAttempt.save()
        } else {
            examAttempt.verification = processedVerification

            if (!isAuthorized) {
                examAttempt.status = 'terminated'
                examAttempt.warnings.push({
                    message: `Student not authorized: ${unauthorizedReason}`,
                    type: 'system',
                    sentAt: new Date()
                })
            }

            await examAttempt.save()
        }

        return NextResponse.json({
            success: true,
            message: 'Verification data saved successfully',
            verificationId: examAttempt._id,
            isAuthorized,
            data: {
                attemptId: examAttempt._id,
                sessionToken: examAttempt.sessionToken
            }
        })

    } catch (error) {
        console.error('Verification API error:', error)
        return NextResponse.json({
            success: false,
            message: 'Internal server error',
            error: error.message
        }, { status: 500 })
    }
}

export async function GET(request) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const attemptId = searchParams.get('attemptId')
        const examId = searchParams.get('examId')
        const userId = searchParams.get('userId')
        const currentUser = await getAuthenticatedUser(request)

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        let query = {}

        if (attemptId) {
            query._id = attemptId
        } else if (examId && userId) {
            query.exam = examId
            query.user = userId
        } else {
            return NextResponse.json({
                success: false,
                message: 'Missing query parameters'
            }, { status: 400 })
        }

        const examAttempt = await ExamAttempt.findOne(query)
            .populate('user', 'name email profileImage')
            .populate('exam', 'name')

        if (!examAttempt) {
            return NextResponse.json({
                success: false,
                message: 'Exam attempt not found'
            }, { status: 404 })
        }

        // Security: Students can only view their own verification, unless admin/teacher
        if (currentUser.role !== 'admin' && currentUser.role !== 'teacher' && examAttempt.user?._id?.toString() !== currentUser.id && examAttempt.user?.toString() !== currentUser.id) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
        }

        return NextResponse.json({
            success: true,
            data: {
                verification: examAttempt.verification,
                warnings: examAttempt.warnings,
                status: examAttempt.status,
                user: examAttempt.user,
                exam: examAttempt.exam
            }
        })

    } catch (error) {
        console.error('Get verification API error:', error)
        return NextResponse.json({
            success: false,
            message: 'Internal server error',
            error: error.message
        }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        await connectDB()

        const body = await request.json()
        const { attemptId, periodicFaceCheck } = body
        const currentUser = await getAuthenticatedUser(request)

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        if (!attemptId || !periodicFaceCheck) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields'
            }, { status: 400 })
        }

        const examAttempt = await ExamAttempt.findById(attemptId).populate('exam')

        if (!examAttempt) {
            return NextResponse.json({
                success: false,
                message: 'Exam attempt not found'
            }, { status: 404 })
        }

        // Security: Students can only update their own attempt
        if (currentUser.role !== 'admin' && examAttempt.user?.toString() !== currentUser.id && examAttempt.user?._id?.toString() !== currentUser.id) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
        }

        let processedFaceCheck = { ...periodicFaceCheck }

        if (periodicFaceCheck.selfieImage) {
            try {
                const facePath = saveVerificationImage(
                    periodicFaceCheck.selfieImage,
                    'face-periodic',
                    examAttempt.user.toString(),
                    examAttempt.exam._id.toString()
                )
                processedFaceCheck.selfieImage = facePath
            } catch (error) {
                console.error('Error saving periodic face check image:', error)
            }
        }

        if (!examAttempt.verification.faceVerification.periodicChecks) {
            examAttempt.verification.faceVerification.periodicChecks = []
        }

        examAttempt.verification.faceVerification.periodicChecks.push({
            capturedAt: processedFaceCheck.capturedAt,
            selfieImage: processedFaceCheck.selfieImage,
            verificationScore: processedFaceCheck.verificationScore,
            warning: processedFaceCheck.warning || false,
            warningReason: processedFaceCheck.warningReason
        })

        if (periodicFaceCheck.warning) {
            examAttempt.warnings.push({
                message: periodicFaceCheck.warningReason || 'Face verification mismatch detected',
                type: 'system',
                sentAt: new Date()
            })
        }

        await examAttempt.save()

        return NextResponse.json({
            success: true,
            message: 'Periodic face check recorded',
            warning: periodicFaceCheck.warning
        })

    } catch (error) {
        console.error('Update verification API error:', error)
        return NextResponse.json({
            success: false,
            message: 'Internal server error',
            error: error.message
        }, { status: 500 })
    }
}
