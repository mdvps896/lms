import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/utils/apiAuth'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        const currentUser = await getAuthenticatedUser(request)

        if (!currentUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized. Please login to access files.' },
                { status: 401 }
            )
        }

        const isAdmin = currentUser.role === 'admin';
        const isStudent = currentUser.role === 'student' || currentUser.role === 'USER'; // USER is student role in some models

        const url = new URL(request.url);
        const filePath = url.searchParams.get('path');

        if (!filePath) {
            return NextResponse.json({ success: false, message: 'File path is required' }, { status: 400 });
        }

        const isCourseVideo = filePath.includes('/courses/videos/');
        const isPublicAsset = filePath.startsWith('uploads/materials/') || filePath.startsWith('uploads/categories/') || filePath.startsWith('uploads/subjects/') || filePath.startsWith('uploads/courses/');

        // Allow access if:
        // 1. User is admin (full access)
        // 2. User is student AND it's a course video or public asset
        if (!isAdmin && !(isStudent && (isCourseVideo || isPublicAsset))) {
            return NextResponse.json(
                { success: false, message: 'Access denied. Insufficient privileges.' },
                { status: 403 }
            );
        }

        const fullPath = path.join(process.cwd(), 'public', filePath)

        if (!fs.existsSync(fullPath)) {
            return NextResponse.json(
                { success: false, message: 'File not found' },
                { status: 404 }
            )
        }

        const fileBuffer = fs.readFileSync(fullPath)
        const ext = path.extname(filePath).toLowerCase()

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
