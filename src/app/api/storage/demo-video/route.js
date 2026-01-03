import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    console.log('GET /api/storage/demo-video - Request received at:', new Date().toISOString());
    try {
        // Get the file path from the URL
        const url = new URL(request.url);
        const filePath = url.searchParams.get('path');

        if (!filePath) {
            return NextResponse.json(
                { success: false, message: 'File path is required' },
                { status: 400 }
            );
        }

        // Only allow specific content
        const isCourseDemoVideo = filePath.includes('courses/videos/');
        const isCourseLectureVideo = filePath.includes('courses/lectures/videos/');
        const isCourseLectureDoc = filePath.includes('courses/lectures/') || filePath.includes('documents/courses/');
        const isFreeMaterial = filePath.includes('uploads/materials/');

        if (!isCourseDemoVideo && !isCourseLectureVideo && !isCourseLectureDoc && !isFreeMaterial) {
            return NextResponse.json(
                { success: false, message: 'Access denied. This endpoint is only for course content.' },
                { status: 403 }
            );
        }

        // Read the file
        const fs = require('fs');
        const path = require('path');
        // Ensure filePath doesn't start with / for path.join to work correctly relative to public
        const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
        const fullPath = path.normalize(path.join(process.cwd(), 'public', cleanPath));

        console.log('Serving File:', { filePath, cleanPath, fullPath, exists: fs.existsSync(fullPath) });

        if (!fs.existsSync(fullPath)) {
            console.log('File NOT found at:', fullPath);
            return NextResponse.json(
                { success: false, message: 'File not found' },
                { status: 404 }
            );
        }

        const stats = fs.statSync(fullPath);
        const fileSize = stats.size;
        const range = request.headers.get('range');
        const ext = path.extname(filePath).toLowerCase();

        // Content types mapping
        const contentTypes = {
            '.mp4': 'video/mp4', '.pdf': 'application/pdf', '.png': 'image/png',
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.txt': 'text/plain'
        };
        const contentType = contentTypes[ext] || 'application/octet-stream';

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(fullPath, { start, end });

            const webStream = new ReadableStream({
                start(controller) {
                    file.on('data', (chunk) => controller.enqueue(chunk));
                    file.on('end', () => controller.close());
                    file.on('error', (err) => controller.error(err));
                },
                cancel() { file.destroy(); },
            });

            return new NextResponse(webStream, {
                status: 206,
                headers: {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize.toString(),
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*'
                }
            });
        } else {
            const stream = fs.createReadStream(fullPath);
            const webStream = new ReadableStream({
                start(controller) {
                    stream.on('data', (chunk) => controller.enqueue(chunk));
                    stream.on('end', () => controller.close());
                    stream.on('error', (err) => controller.error(err));
                },
                cancel() { stream.destroy(); },
            });

            return new NextResponse(webStream, {
                status: 200,
                headers: {
                    'Content-Length': fileSize.toString(),
                    'Content-Type': contentType,
                    'Accept-Ranges': 'bytes',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

    } catch (error) {
        console.error('Error serving demo video:', error);
        return NextResponse.json(
            { success: false, message: 'Error serving file', error: error.message, stack: error.stack },
            { status: 500 }
        );
    }
}
