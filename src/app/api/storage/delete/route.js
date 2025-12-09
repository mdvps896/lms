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
                const result = await deleteFromCloudinary(publicId, resourceType || 'image')
                return NextResponse.json({
                    success: result.success,
                    message: result.success ? 'File deleted from Cloudinary successfully' : 'Failed to delete file from Cloudinary'
                })
            } catch (error) {
                console.error('Cloudinary delete error:', error)
                return NextResponse.json(
                    { success: false, message: 'Error deleting file from Cloudinary' },
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
