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

        const fullPath = path.join(process.cwd(), 'storage', filePath);

        // This route is public, unauthenticated and cacheable. Anything
        // sensitive must never be reachable through it — it is served instead
        // via the token-gated /api/storage/secure-file route. Pretend the
        // resource simply doesn't exist rather than exposing the reason.
        //
        // Exception: a course's top-level "demo/preview" video
        // (uploads/videos/courses/videos/...) is deliberately public marketing
        // content, like the thumbnail — it's meant to entice signup before
        // enrollment, so it's exempt from the video lockdown below. Lecture
        // videos (uploads/videos/courses/lectures/videos/...) and anything
        // under uploads/materials/ are NOT exempt.
        const lower = filePath.toLowerCase();
        const isPublicDemoVideo = lower.startsWith('uploads/videos/courses/videos/');
        const SENSITIVE_EXTENSIONS = new Set(['.pdf', '.mp4', '.avi', '.mov', '.webm', '.mkv', '.flv', '.wmv']);
        const isSensitive =
            !isPublicDemoVideo && (
                SENSITIVE_EXTENSIONS.has(path.extname(fullPath).toLowerCase()) ||
                lower.includes('uploads/selfies/') ||
                lower.startsWith('selfies/') ||
                lower.includes('verification/') ||
                lower.includes('/selfies/')
            );
        if (isSensitive) {
            return new NextResponse('File not found', { status: 404 });
        }

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
            // 🔒 SECURITY: SVG is an executable document. Serving user-uploaded
            // SVG as image/svg+xml from this origin is stored XSS. Force it to
            // download instead of rendering (see contentDisposition below).
            '.svg': 'application/octet-stream',
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

        // Anything we don't positively recognise as inert media is sent as an
        // attachment, so the browser can never execute it in our origin.
        const inlineSafe = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mp3', '.wav', '.txt'];
        const contentDisposition = inlineSafe.includes(ext)
            ? 'inline'
            : `attachment; filename="${path.basename(fullPath).replace(/"/g, '')}"`;

        // 🔒 M3: a Range header is attacker-controlled. Unvalidated parseInt
        // results (NaN, negative, or past EOF) produced a stream error and a
        // 500 instead of the correct 416.
        const parseRange = (header, size) => {
            const match = /^bytes=(\d*)-(\d*)$/.exec((header || '').trim());
            if (!match) return null;

            const [, rawStart, rawEnd] = match;
            let start;
            let end;

            if (rawStart === '') {
                // Suffix form: "bytes=-500" means the last 500 bytes.
                if (rawEnd === '') return null;
                const suffix = parseInt(rawEnd, 10);
                if (!Number.isFinite(suffix) || suffix <= 0) return null;
                start = Math.max(0, size - suffix);
                end = size - 1;
            } else {
                start = parseInt(rawStart, 10);
                end = rawEnd === '' ? size - 1 : parseInt(rawEnd, 10);
            }

            if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
            if (start < 0 || end < start || start >= size) return null;

            return { start, end: Math.min(end, size - 1) };
        };

        // Handle partial content (Video streaming)
        if (range) {
            const parsed = parseRange(range, fileSize);
            if (!parsed) {
                return new NextResponse('Range Not Satisfiable', {
                    status: 416,
                    headers: { 'Content-Range': `bytes */${fileSize}` }
                });
            }

            const { start, end } = parsed;
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
                    'Content-Disposition': contentDisposition,
                    'X-Content-Type-Options': 'nosniff',
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
                'Content-Disposition': contentDisposition,
                'X-Content-Type-Options': 'nosniff',
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
