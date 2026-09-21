import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ESignSubmission from '@/models/ESignSubmission';
import crypto from 'crypto';
import { generateESignPDF } from '../../../student/esign/pdf/generator';
import { checkOTPRateLimit } from '@/utils/otpRateLimit';

export const dynamic = 'force-dynamic';

/**
 * Public PDF download for a guest's own APPROVED submission, authorized by
 * submissionId + accessToken exactly like /api/public/esign/status.
 * Reuses the same generateESignPDF() the app/admin flows already use —
 * no separate PDF logic for the public form.
 */
function getClientIp(req) {
    return (
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown'
    );
}

function tokensMatch(expected, provided) {
    if (typeof expected !== 'string' || typeof provided !== 'string') return false;
    const a = Buffer.from(expected);
    const b = Buffer.from(provided);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

export async function GET(request) {
    try {
        const ip = getClientIp(request);
        const rateLimit = checkOTPRateLimit(`public-esign-pdf:${ip}`);
        if (!rateLimit.allowed) {
            return NextResponse.json({ success: false, message: 'Too many requests. Please try again shortly.' }, { status: 429 });
        }

        await connectDB();
        const { searchParams } = new URL(request.url);
        const submissionId = searchParams.get('submissionId');
        const token = searchParams.get('token');

        if (!submissionId || !token) {
            return NextResponse.json({ success: false, message: 'submissionId and token are required' }, { status: 400 });
        }

        const submission = await ESignSubmission.findOne({
            _id: submissionId,
            source: 'public_web'
        }).select('+publicAccessToken');

        if (!submission || !tokensMatch(submission.publicAccessToken, token)) {
            return NextResponse.json({ success: false, message: 'Submission not found' }, { status: 404 });
        }

        if (submission.adminStatus !== 'Approved') {
            return NextResponse.json(
                { success: false, message: 'This submission has not been approved yet.' },
                { status: 403 }
            );
        }

        // No linked User document for a public submission, so there is no
        // esign_images side-channel — generateESignPDF now reads
        // documents.signatureImage directly (see ESignSubmission.js).
        const pdfArrayBuffer = await generateESignPDF(submission, {}, null);
        const buffer = Buffer.from(pdfArrayBuffer);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${(submission.personalDetails?.fullName || 'esign').replace(/\s+/g, '_')}_ESign.pdf"`,
            },
        });
    } catch (error) {
        console.error('Public E-Sign PDF Generation Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to generate PDF' }, { status: 500 });
    }
}
