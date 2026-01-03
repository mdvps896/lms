import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        // Check if user is authenticated
        const userCookie = request.cookies.get('user')

        if (!userCookie) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized. Please login to access files.' },
                { status: 401 }
            )
        }

        // Parse user data
        let user
        try {
            user = JSON.parse(userCookie.value)
        } catch (error) {
            return NextResponse.json(
                { success: false, message: 'Invalid authentication token.' },
                { status: 401 }
            )
        }

        // Check user role - allow admin and students for course videos
        const isAdmin = user.role === 'admin';
        const isStudent = user.role === 'student';

        // Get the file path to check if it's a course video
        const url = new URL(request.url);
        const filePath = url.searchParams.get('path');
        const isCourseVideo = filePath && filePath.includes('/courses/videos/');

        // Allow access if:
        // 1. User is admin (full access)
        // 2. User is student AND it's a course video
        if (!isAdmin && !(isStudent && isCourseVideo)) {
            return NextResponse.json(
                { success: false, message: 'Access denied. Insufficient privileges.' },
                { status: 403 }
            );
        }

        if (!filePath) {
            return NextResponse.json(
                { success: false, message: 'File path is required' },
                { status: 400 }
            )
        }

        // Read the file
        const fs = require('fs')
        const path = require('path')
        const fullPath = path.join(process.cwd(), 'public', filePath)

        if (!fs.existsSync(fullPath)) {
            return NextResponse.json(
                { success: false, message: 'File not found' },
                { status: 404 }
            )
        }

        // Read file and return
        const fileBuffer = fs.readFileSync(fullPath)
        const ext = path.extname(filePath).toLowerCase()

        // Set appropriate content type
        const contentTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }

        const contentType = contentTypes[ext] || 'application/octet-stream'

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
                'Cache-Control': 'private, no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        })

    } catch (error) {
        console.error('Error serving file:', error)
        return NextResponse.json(
            { success: false, message: 'Error serving file' },
            { status: 500 }
        )
    }
}
