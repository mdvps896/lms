import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/utils/apiAuth';

// Authenticated, view-only PDF proxy. Unlike /api/storage/file, this never
// caches, never sets a wildcard CORS header, and only serves files that live
// under the uploads directory and end in .pdf — it exists so admins can view
// material PDFs (assembled transparently from disk chunks) without the file
// ever being reachable as a plain downloadable URL.
export async function GET(request) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const { searchParams } = new URL(request.url);
        const filePath = searchParams.get('path') || '';

        if (!filePath || filePath.includes('..') || !filePath.startsWith('uploads/')) {
            return new NextResponse('Invalid path', { status: 400 });
        }

        if (path.extname(filePath).toLowerCase() !== '.pdf') {
            return new NextResponse('Invalid path', { status: 400 });
        }

        const fullPath = path.join(process.cwd(), 'storage', filePath);

        if (!fs.existsSync(fullPath)) {
            return new NextResponse('File not found', { status: 404 });
        }

        const stat = fs.statSync(fullPath);
        const range = request.headers.get('range');

        const noStoreHeaders = {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline',
            'Cache-Control': 'no-store, must-revalidate',
            'X-Content-Type-Options': 'nosniff',
        };

        if (stat.isDirectory()) {
            return new NextResponse('File not found', { status: 404 });
        }

        const fileSize = stat.size;

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
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
                    ...noStoreHeaders,
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize.toString(),
                }
            });
        }

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
                ...noStoreHeaders,
                'Content-Length': fileSize.toString(),
                'Accept-Ranges': 'bytes',
            }
        });
    } catch (error) {
        console.error('Error serving admin PDF view:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
