import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request) {
    try {
        const { filePath } = await request.json()

        if (!filePath) {
            return NextResponse.json(
                { success: false, message: 'File path is required' },
                { status: 400 }
            )
        }

        // In production (Vercel), file system is read-only after deployment
        // Files in /public are part of the build and cannot be deleted at runtime
        if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'File deletion not supported in production. Files are part of the deployment and cannot be modified. Please use external storage (Cloudinary, S3) for dynamic file management.' 
                },
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
