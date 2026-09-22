import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/utils/apiAuth'
import connectDB from '@/lib/mongodb'
import fs from 'fs'
import path from 'path'
import { verifyPdfAccessToken, normalizePdfPath, claimTokenForIp } from '@/utils/pdfAccessToken'
import { authorizePdfAccess } from '@/utils/pdfAuthorization'

export const dynamic = 'force-dynamic';

function getClientIp(req) {
    return (
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown'
    );
}

// PDFs served here are gated ENTIRELY by a signed, short-lived access token
// (issued by /api/storage/pdf-token). Every request re-verifies the token
// signature + expiry, checks the token's bound path matches the requested path
// exactly, and re-derives the user's authorization live from the database. A
// plain URL with no token, a tampered path, a swapped user, or a revoked
// enrollment all fail here — even mid-session.
async function serveSecurePdf(request, normalizedPath) {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    // No token → behave as if the file does not exist. Never hint that a
    // token would help.
    const payload = await verifyPdfAccessToken(token);
    if (!payload) {
        if (process.env.NODE_ENV !== 'production') console.warn('[secure-file] 404: bad/expired token');
        return new NextResponse('File not found', { status: 404 });
    }

    // The token is bound to one exact path. Asking for any other file with it
    // is a tamper attempt.
    if (payload.p !== normalizedPath) {
        if (process.env.NODE_ENV !== 'production') console.warn('[secure-file] 404: path mismatch', { tokenPath: payload.p, normalizedPath });
        return new NextResponse('File not found', { status: 404 });
    }

    // 🔒 The token alone used to be enough — copy the URL into another tab,
    // forward it to someone else, and it worked for them too, for the full
    // 5-minute window. The first requester to redeem a given token claims it
    // for their IP; anyone else presenting the same token from a different
    // IP is treated as a leaked/shared link, not the original viewer.
    const clientIp = getClientIp(request);
    if (!claimTokenForIp(payload.jti, clientIp, payload.exp)) {
        if (process.env.NODE_ENV !== 'production') console.warn('[secure-file] 404: token claimed by a different IP', { jti: payload.jti, clientIp });
        return new NextResponse('File not found', { status: 404 });
    }

    await connectDB();

    // Re-load the user fresh — a deleted/blocked user loses access immediately.
    const { default: User } = await import('@/models/User');
    const dbUser = await User.findById(payload.uid).select('role status').lean();
    if (!dbUser || dbUser.status === 'suspended' || dbUser.status === 'inactive') {
        if (process.env.NODE_ENV !== 'production') console.warn('[secure-file] 404: user check failed', { uid: payload.uid, found: !!dbUser, status: dbUser?.status });
        return new NextResponse('File not found', { status: 404 });
    }

    const user = { id: payload.uid, _id: payload.uid, role: dbUser.role };
    const ctx = payload.ctx || {};

    // Re-run the SAME authorization the token was minted under — live, every
    // request. Enrollment expiry / un-enroll / material deletion take effect
    // on the very next hit.
    const { allowed, reason } = await authorizePdfAccess({
        user,
        filePath: normalizedPath,
        courseId: ctx.courseId,
        lectureId: ctx.lectureId,
        materialId: ctx.materialId,
    });
    if (!allowed) {
        if (process.env.NODE_ENV !== 'production') console.warn('[secure-file] 404: not authorized', { reason, ctx });
        return new NextResponse('File not found', { status: 404 });
    }

    let fullPath = path.join(process.cwd(), 'storage', normalizedPath);
    // Fallback for pre-migration records still pointing at their old
    // public/ location (see the matching fallback in /api/storage/file).
    if (!fs.existsSync(fullPath)) {
        const publicFallback = path.join(process.cwd(), 'public', normalizedPath);
        if (fs.existsSync(publicFallback)) {
            fullPath = publicFallback;
        }
    }
    if (!fs.existsSync(fullPath)) {
        if (process.env.NODE_ENV !== 'production') console.warn('[secure-file] 404: file missing on disk', { fullPath });
        return new NextResponse('File not found', { status: 404 });
    }

    const mediaContentTypes = {
        '.pdf': 'application/pdf',
        '.mp4': 'video/mp4',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.webm': 'video/webm',
        '.mkv': 'video/x-matroska',
        '.flv': 'video/x-flv',
        '.wmv': 'video/x-ms-wmv',
    };
    const contentType = mediaContentTypes[path.extname(normalizedPath).toLowerCase()] || 'application/octet-stream';

    const noStoreHeaders = {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
    };

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
        return new NextResponse('File not found', { status: 404 });
    }
    const range = request.headers.get('range');

    const fileSize = stat.size;
    if (range) {
        const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
        let start = m && m[1] !== '' ? parseInt(m[1], 10) : 0;
        let end = m && m[2] !== '' ? parseInt(m[2], 10) : fileSize - 1;
        if (!m || !Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= fileSize || end < start) {
            return new NextResponse('Range Not Satisfiable', { status: 416, headers: { 'Content-Range': `bytes */${fileSize}` } });
        }
        end = Math.min(end, fileSize - 1);
        const fileStream = fs.createReadStream(fullPath, { start, end });
        const webStream = new ReadableStream({
            start(controller) {
                fileStream.on('data', (c) => controller.enqueue(c));
                fileStream.on('end', () => controller.close());
                fileStream.on('error', (e) => controller.error(e));
            },
            cancel() { fileStream.destroy(); },
        });
        return new NextResponse(webStream, {
            status: 206,
            headers: { ...noStoreHeaders, 'Content-Range': `bytes ${start}-${end}/${fileSize}`, 'Accept-Ranges': 'bytes', 'Content-Length': String(end - start + 1) },
        });
    }

    const fileStream = fs.createReadStream(fullPath);
    const webStream = new ReadableStream({
        start(controller) {
            fileStream.on('data', (c) => controller.enqueue(c));
            fileStream.on('end', () => controller.close());
            fileStream.on('error', (e) => controller.error(e));
        },
        cancel() { fileStream.destroy(); },
    });
    return new NextResponse(webStream, {
        headers: { ...noStoreHeaders, 'Content-Length': String(fileSize), 'Accept-Ranges': 'bytes' },
    });
}

const SECURE_MEDIA_EXTENSIONS = new Set(['.pdf', '.mp4', '.avi', '.mov', '.webm', '.mkv', '.flv', '.wmv']);

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const rawFilePath = url.searchParams.get('path');

        if (!rawFilePath) {
            return NextResponse.json({ success: false, message: 'File path is required' }, { status: 400 });
        }

        // Callers pass a mix of forms: `/uploads/x`, `uploads/x`,
        // `/api/storage/file/uploads/x`. Reduce them all to `uploads/x`
        // (no leading slash) so the whitelist / owner checks below line up.
        let filePath = rawFilePath.replace(/^\/?api\/storage\/file\//, '');
        if (filePath.startsWith('/')) filePath = filePath.slice(1);

        // -------- PDF / video: token-gated, no session required, re-checked every hit --------
        if (!filePath.startsWith('http') && SECURE_MEDIA_EXTENSIONS.has(path.extname(filePath).toLowerCase())) {
            const normalizedPath = normalizePdfPath(filePath);
            if (!normalizedPath) {
                return new NextResponse('File not found', { status: 404 });
            }
            return serveSecurePdf(request, normalizedPath);
        }

        // -------- Everything else: existing session-based access --------
        const currentUser = await getAuthenticatedUser(request)
        if (!currentUser) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized. Please login to access files.' },
                { status: 401 }
            )
        }

        const isAdmin = currentUser.role === 'admin';
        const isStudent = currentUser.role === 'student' || currentUser.role === 'USER';

        // Handle remote URLs (e.g. Cloudinary) — admin only.
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            if (!isAdmin) {
                return NextResponse.json(
                    { success: false, message: 'Access denied. Proxied remote files are admin-only.' },
                    { status: 403 }
                );
            }
            try {
                const response = await fetch(filePath);
                if (!response.ok) throw new Error('Failed to fetch remote file');
                const remoteBuffer = await response.arrayBuffer();
                const contentType = response.headers.get('content-type') || 'application/octet-stream';
                return new NextResponse(remoteBuffer, {
                    headers: {
                        'Content-Type': contentType,
                        'Cache-Control': 'private, max-age=3600',
                        'Content-Disposition': `inline; filename="${path.basename(filePath)}"`
                    }
                });
            } catch (error) {
                console.error('Remote fetch error:', error);
                return NextResponse.json({ success: false, message: 'Failed to proxy remote file' }, { status: 502 });
            }
        }

        const isCourseAsset = filePath.includes('/courses/');
        const isPublicAsset = filePath.startsWith('uploads/materials/') || filePath.startsWith('uploads/categories/') || filePath.startsWith('uploads/subjects/') || filePath.startsWith('uploads/courses/');

        // Selfies + face-verification images: admin, or the student they
        // belong to. Paths:
        //   uploads/selfies/<userId>/<courseId>/...
        //   verification/<type>/<examId>/<userId>_<ts>.jpg
        const uid = String(currentUser.id || currentUser._id || '');
        const norm = filePath.replace(/^\/+/, '');
        const isSelfieOrVerification = norm.startsWith('uploads/selfies/') || norm.startsWith('verification/');
        const ownsSelfieOrVerification =
            isSelfieOrVerification && uid.length > 0 &&
            (norm.startsWith(`uploads/selfies/${uid}/`) || norm.includes(`/${uid}_`));

        // Selfie/verification media is NEVER a "public asset" — only admin or
        // owner, regardless of any prefix overlap.
        const allowed = isSelfieOrVerification
            ? (isAdmin || ownsSelfieOrVerification)
            : (isAdmin || (isStudent && (isCourseAsset || isPublicAsset)));

        if (!allowed) {
            console.warn(
                `[secure-file] 403: role=${currentUser.role} rawPath=${JSON.stringify(rawFilePath)} ` +
                `normalizedPath=${JSON.stringify(filePath)} isCourseAsset=${isCourseAsset} isPublicAsset=${isPublicAsset}`
            );
            return NextResponse.json(
                { success: false, message: 'Access denied. Insufficient privileges.' },
                { status: 403 }
            );
        }

        let fullPath = path.join(process.cwd(), 'storage', filePath)
        // Fallback for pre-migration records still pointing at their old
        // public/ location (see the matching fallback in /api/storage/file).
        if (!fs.existsSync(fullPath)) {
            const publicFallback = path.join(process.cwd(), 'public', filePath);
            if (fs.existsSync(publicFallback)) {
                fullPath = publicFallback;
            }
        }

        if (!fs.existsSync(fullPath)) {
            return NextResponse.json({ success: false, message: 'File not found' }, { status: 404 })
        }

        if (fs.statSync(fullPath).isDirectory()) {
            return NextResponse.json({ success: false, message: 'File not found' }, { status: 404 })
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
        return NextResponse.json({ success: false, message: 'Error serving file' }, { status: 500 })
    }
}
