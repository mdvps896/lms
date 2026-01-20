import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
    try {
        const pathSegments = params.path || [];
        const filePath = pathSegments.join('/');

        // Prevent path traversal
        if (filePath.includes('..')) {
            return new NextResponse('Invalid path', { status: 400 });
        }

        const fullPath = path.join(process.cwd(), 'public', filePath);

        if (!fs.existsSync(fullPath)) {
            // Try looking in top level public if not found (sometimes uploads folder is at root)
            // But standard is process.cwd()/public
            return new NextResponse('File not found', { status: 404 });
        }

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            return new NextResponse('Is a directory', { status: 400 });
        }

        const fileBuffer = fs.readFileSync(fullPath);

        // Determine content type
        const ext = path.extname(fullPath).toLowerCase();
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
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.txt': 'text/plain'
        };

        const contentType = contentTypes[ext] || 'application/octet-stream';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': stat.size.toString(),
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });

    } catch (error) {
        console.error('Error serving file:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
