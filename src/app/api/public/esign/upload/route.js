import { NextResponse } from 'next/server';
import path from 'path';
import { saveToLocalStorage } from '@/utils/localStorage';
import { checkOTPRateLimit } from '@/utils/otpRateLimit';

export const dynamic = 'force-dynamic';

/**
 * Public, unauthenticated image upload — used ONLY by the public e-sign form
 * (/esign) for people filling the form without a mobile-app account. Locked
 * down the same way the general /api/upload endpoint is (H6 hardening):
 * raster images only, size-capped, safe filenames — plus an IP rate limit,
 * since this endpoint has no login to throttle abuse by account.
 */

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB — these are phone-camera photos

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

function getClientIp(req) {
    return (
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown'
    );
}

export async function POST(request) {
    try {
        const ip = getClientIp(request);
        // Looser than the default OTP limit — a single e-sign session
        // legitimately uploads several photos (ID front/back, signature, etc.)
        // in quick succession.
        const rateLimit = checkOTPRateLimit(`public-esign-upload:${ip}`, {
            maxAttempts: 10,
            attemptWindowMs: 2 * 60 * 1000,
            blockDurationMs: 5 * 60 * 1000,
        });
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { success: false, message: rateLimit.message || 'Too many uploads. Please slow down and try again shortly.' },
                { status: 429 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || typeof file.arrayBuffer !== 'function') {
            return NextResponse.json({ success: false, message: 'No file received.' }, { status: 400 });
        }

        if (file.size > MAX_UPLOAD_BYTES) {
            return NextResponse.json(
                { success: false, message: 'File is too large (5 MB maximum).' },
                { status: 413 }
            );
        }

        const originalName = typeof file.name === 'string' ? file.name : 'upload';
        const extension = path.extname(originalName).toLowerCase();

        if (!ALLOWED_MIME.has(file.type) || !ALLOWED_EXT.has(extension)) {
            return NextResponse.json(
                { success: false, message: 'Only JPG, PNG, WEBP and AVIF images may be uploaded.' },
                { status: 415 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString('base64');
        const fileData = `data:${file.type};base64,${base64}`;

        const safeStem = path
            .basename(originalName, extension)
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .slice(0, 60) || 'upload';
        const filename = `public_esign_${Date.now()}_${safeStem}${extension}`;

        const result = await saveToLocalStorage(fileData, 'esign-public', filename);

        if (!result?.success && result?.error) {
            return NextResponse.json(
                { success: false, message: result.message || 'Upload failed.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, url: result.url });
    } catch (error) {
        console.error('Public e-sign upload error:', error);
        return NextResponse.json({ success: false, message: 'Upload failed.' }, { status: 500 });
    }
}
