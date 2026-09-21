import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ESignSubmission from '@/models/ESignSubmission';
import crypto from 'crypto';
import { checkOTPRateLimit } from '@/utils/otpRateLimit';

export const dynamic = 'force-dynamic';

/**
 * Public status check for a guest's own submission. Authorized by
 * `submissionId` + `accessToken` (issued once at /api/public/esign/submit) —
 * NOT by email — so one guest can't look up another guest's submission by
 * guessing/knowing their email address.
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
        const rateLimit = checkOTPRateLimit(`public-esign-status:${ip}`);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { success: false, message: 'Too many requests. Please try again shortly.' },
                { status: 429 }
            );
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
            // Same message for "not found" and "wrong token" — don't give an
            // attacker a way to tell a valid submissionId from an invalid one.
            return NextResponse.json({ success: false, message: 'Submission not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            submitted: true,
            submissionId: submission._id,
            submissionDate: submission.createdAt,
            status: submission.adminStatus,
            pdfGenerated: submission.pdfGenerated,
            data: {
                personalDetails: submission.personalDetails,
                signature: submission.signature
            }
        });
    } catch (error) {
        console.error('Error checking public esign status:', error);
        return NextResponse.json({ success: false, message: 'Failed to check status' }, { status: 500 });
    }
}
