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

        const fileSize = stat.size;
        const range = request.headers.get('range');

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

        // Handle partial content (Video streaming)
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const fileStream = fs.createReadStream(fullPath, { start, end });

            const webStream = new ReadableStream({
                start(controller) {
                    fileStream.on('data', (chunk) => controller.enqueue(chunk));
                    fileStream.on('end', () => controller.close());
                    fileStream.on('error', (err) => controller.error(err));
                },
                cancel() { fileStream.destroy(); },
            });

            return new NextResponse(webStream, {
                status: 206,
                headers: {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize.toString(),
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=3600'
                }
            });
        }

        // Handle full content (Download / Small files)
        const fileStream = fs.createReadStream(fullPath);
        const webStream = new ReadableStream({
            start(controller) {
                fileStream.on('data', (chunk) => controller.enqueue(chunk));
                fileStream.on('end', () => controller.close());
                fileStream.on('error', (err) => controller.error(err));
            },
            cancel() { fileStream.destroy(); },
        });

        return new NextResponse(webStream, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': fileSize.toString(),
                'Accept-Ranges': 'bytes', // Crucial for players to know range is supported
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Range'
            }
        });

    } catch (error) {
        console.error('Error serving file:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
