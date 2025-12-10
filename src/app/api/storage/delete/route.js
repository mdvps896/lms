import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { deleteFromCloudinary, getCloudinaryStatus } from '@/utils/cloudinary'

export async function POST(request) {
    try {
        const { filePath, publicId, resourceType } = await request.json()

        if (!filePath && !publicId) {
            return NextResponse.json(
                { success: false, message: 'File path or publicId is required' },
                { status: 400 }
            )
        }

        // Check if Cloudinary is enabled
        const cloudinaryStatus = await getCloudinaryStatus()

        if (cloudinaryStatus.enabled && cloudinaryStatus.configured && publicId) {
            // Delete from Cloudinary
            try {
                // Auto-detect resource type if not provided
                let detectedResourceType = resourceType
                if (!detectedResourceType) {
                    // If publicId contains 'video' or common video extensions, treat as video
                    if (publicId.includes('camera-') || publicId.includes('screen-') || 
                        publicId.includes('video') || publicId.endsWith('.mp4') || 
                        publicId.endsWith('.webm') || publicId.endsWith('.avi')) {
                        detectedResourceType = 'video'
                    } else {
                        detectedResourceType = 'image'
                    }
                }
                
                console.log(`🗑️ Deleting from Cloudinary: ${publicId} (${detectedResourceType})`)
                
                const result = await deleteFromCloudinary(publicId, detectedResourceType)
                
                console.log('Delete result:', result)
                
                return NextResponse.json({
                    success: result.success,
                    message: result.success ? 
                        `File deleted from Cloudinary successfully (${detectedResourceType})` : 
                        `Failed to delete file from Cloudinary: ${result.result || 'Unknown error'}`
                })
            } catch (error) {
                console.error('Cloudinary delete error:', error)
                return NextResponse.json(
                    { success: false, message: `Error deleting file from Cloudinary: ${error.message}` },
                    { status: 500 }
                )
            }
        }

        // Fallback to local storage deletion (for development only)
        if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'File deletion not supported in production. Files are part of the deployment. Please enable Cloudinary in Settings for dynamic file management.' 
                },
                { status: 400 }
            )
        }

        if (!filePath) {
            return NextResponse.json(
                { success: false, message: 'File path is required for local storage' },
                { status: 400 }
            )
        }

        const fullPath = path.join(process.cwd(), 'public', filePath)

        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            return NextResponse.json(
                { success: false, message: 'File not found' },
                { status: 404 }
            )
        }

        // Delete the file
        fs.unlinkSync(fullPath)

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting file:', error)
        return NextResponse.json(
            { success: false, message: error.message || 'Error deleting file' },
            { status: 500 }
        )
    }
}
