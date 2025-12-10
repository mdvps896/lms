import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamAttempt from '@/models/ExamAttempt'
import Exam from '@/models/Exam'
import { deleteFromLocalStorage } from '@/utils/localStorage'

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
        let deletionMethod = 'local'
        let isReadOnlyFS = false

        // Delete from local storage
        try {
            console.log(`🗑️ Deleting exam recording from local storage: ${recordingUrl}`)
            
            const deleteResult = await deleteFromLocalStorage(recordingUrl)
            deletionSuccess = deleteResult.success
            isReadOnlyFS = deleteResult.readOnlyFS || false
            
            if (!deletionSuccess && !isReadOnlyFS) {
                console.warn('Failed to delete from local storage, but continuing with database cleanup')
            } else if (isReadOnlyFS) {
                console.log('⚠️ Running on read-only filesystem - database will be updated but file persists in deployment')
            }
        } catch (error) {
            console.error('Local storage deletion error:', error)
            // Continue with database cleanup even if file deletion fails
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
            message: isReadOnlyFS 
                ? `${recordingType} recording removed from database (read-only filesystem)`
                : `${recordingType} recording deleted successfully (${deletionMethod})`,
            deletionMethod,
            fileDeleted: deletionSuccess,
            readOnlyFS: isReadOnlyFS,
            warning: isReadOnlyFS ? 'File still exists in deployment but is no longer accessible via the app' : undefined
        })

    } catch (error) {
        console.error('Error deleting exam recording:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to delete recording' },
            { status: 500 }
        )
    }
}