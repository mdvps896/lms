import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamAttempt from '@/models/ExamAttempt'
import Exam from '@/models/Exam'
import { deleteFromCloudinary, getCloudinaryStatus } from '@/utils/cloudinary'
import { unlink } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function POST(request) {
    try {
        await connectDB()
        
        const { attemptId, recordingType } = await request.json()

        if (!attemptId || !recordingType) {
            return NextResponse.json(
                { success: false, message: 'Missing attemptId or recordingType' },
                { status: 400 }
            )
        }

        // Find the exam attempt in both models
        let attempt = await ExamAttempt.findById(attemptId)
        let examWithAttempt = null
        
        // If not found in ExamAttempt, check in Exam.attempts
        if (!attempt) {
            examWithAttempt = await Exam.findOne({ 'attempts._id': attemptId })
            if (examWithAttempt) {
                attempt = examWithAttempt.attempts.id(attemptId)
            }
        }
        
        if (!attempt) {
            return NextResponse.json(
                { success: false, message: 'Exam attempt not found' },
                { status: 404 }
            )
        }

        // Get the recording URL
        const recordingUrl = recordingType === 'camera' ? 
            attempt.recordings?.cameraVideo : 
            attempt.recordings?.screenVideo

        if (!recordingUrl) {
            return NextResponse.json(
                { success: false, message: 'Recording not found' },
                { status: 404 }
            )
        }

        let deletionSuccess = false
        let deletionMethod = null

        // If it's a Cloudinary URL, delete from Cloudinary
        if (recordingUrl.includes('cloudinary')) {
            deletionMethod = 'cloudinary'
            const cloudinaryStatus = await getCloudinaryStatus()
            
            if (cloudinaryStatus.enabled && cloudinaryStatus.configured) {
                try {
                    // Extract publicId from URL
                    const urlParts = recordingUrl.split('/')
                    let publicId = urlParts[urlParts.length - 1].split('.')[0]
                    
                    // If it includes folder, get the full path
                    const folderIndex = urlParts.indexOf('exam-recordings')
                    if (folderIndex !== -1 && folderIndex < urlParts.length - 1) {
                        publicId = urlParts.slice(folderIndex).join('/').split('.')[0]
                    }
                    
                    console.log(`🗑️ Deleting exam recording from Cloudinary: ${publicId}`)
                    
                    const deleteResult = await deleteFromCloudinary(publicId, 'video')
                    deletionSuccess = deleteResult.success
                    
                    if (!deletionSuccess) {
                        console.warn('Failed to delete from Cloudinary, but continuing with database cleanup')
                    }
                } catch (error) {
                    console.error('Cloudinary deletion error:', error)
                    // Continue with database cleanup even if Cloudinary deletion fails
                }
            }
        } else if (recordingUrl.startsWith('/exam-videos/') || recordingUrl.startsWith('/exam-screen-videos/')) {
            // It's a local file, delete from filesystem
            deletionMethod = 'local'
            try {
                const filePath = path.join(process.cwd(), 'public', recordingUrl)
                await unlink(filePath)
                deletionSuccess = true
                console.log(`🗑️ Deleted local exam recording: ${filePath}`)
            } catch (error) {
                console.error('Local file deletion error:', error)
                // Continue with database cleanup even if file deletion fails
            }
        }

        // Remove the recording URL from the database
        const updateField = recordingType === 'camera' ? 
            'recordings.cameraVideo' : 
            'recordings.screenVideo'

        // Update ExamAttempt model if it exists
        try {
            const examAttemptUpdate = await ExamAttempt.updateOne(
                { _id: attemptId },
                { $unset: { [updateField]: "" } }
            )
            console.log(`📝 Updated ExamAttempt model: ${examAttemptUpdate.modifiedCount} records`)
        } catch (error) {
            console.log('ExamAttempt not found or error updating:', error.message)
        }

        // Update Exam.attempts if found there
        if (examWithAttempt) {
            try {
                if (recordingType === 'camera') {
                    attempt.recordings.cameraVideo = undefined
                } else {
                    attempt.recordings.screenVideo = undefined
                }
                
                examWithAttempt.markModified('attempts')
                await examWithAttempt.save()
                console.log(`📝 Updated Exam.attempts model`)
            } catch (error) {
                console.error('Error updating Exam.attempts:', error)
            }
        }

        console.log(`✅ Exam recording deleted: ${recordingType} for attempt ${attemptId}`)

        return NextResponse.json({
            success: true,
            message: `${recordingType} recording deleted successfully (${deletionMethod})`,
            deletionMethod,
            fileDeleted: deletionSuccess
        })

    } catch (error) {
        console.error('Error deleting exam recording:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to delete recording' },
            { status: 500 }
        )
    }
}