import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ExamAttempt from '@/models/ExamAttempt'
import { deleteFromCloudinary, getCloudinaryStatus } from '@/utils/cloudinary'

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

        // Find the exam attempt
        const attempt = await ExamAttempt.findById(attemptId)
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

        let cloudinaryDeleted = false

        // If it's a Cloudinary URL, delete from Cloudinary
        if (recordingUrl.includes('cloudinary')) {
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
                    cloudinaryDeleted = deleteResult.success
                    
                    if (!cloudinaryDeleted) {
                        console.warn('Failed to delete from Cloudinary, but continuing with database cleanup')
                    }
                } catch (error) {
                    console.error('Cloudinary deletion error:', error)
                    // Continue with database cleanup even if Cloudinary deletion fails
                }
            }
        }

        // Remove the recording URL from the database
        const updateField = recordingType === 'camera' ? 
            'recordings.cameraVideo' : 
            'recordings.screenVideo'

        await ExamAttempt.updateOne(
            { _id: attemptId },
            { $unset: { [updateField]: "" } }
        )

        console.log(`✅ Exam recording deleted: ${recordingType} for attempt ${attemptId}`)

        return NextResponse.json({
            success: true,
            message: `${recordingType} recording deleted successfully`,
            cloudinaryDeleted: cloudinaryDeleted
        })

    } catch (error) {
        console.error('Error deleting exam recording:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to delete recording' },
            { status: 500 }
        )
    }
}