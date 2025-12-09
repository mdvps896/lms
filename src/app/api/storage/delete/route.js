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

        // In serverless environment (Vercel), file system is read-only
        // Files should be stored in external storage (S3, Cloudinary, etc.)
        if (process.env.VERCEL) {
            return NextResponse.json(
                { success: false, message: 'File deletion not supported in serverless environment. Please use external storage.' },
                { status: 501 }
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
