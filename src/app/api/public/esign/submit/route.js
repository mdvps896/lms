import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ESignSubmission from '@/models/ESignSubmission';
import { checkOTPRateLimit } from '@/utils/otpRateLimit';

export const dynamic = 'force-dynamic';

/**
 * Public, unauthenticated e-sign submission — the same digital consent form
 * the mobile app collects from logged-in students, but for anyone who
 * doesn't have (or want) the app. No account is created and nothing here
 * requires a User document; see ESignSubmission.js for the schema changes
 * that made that possible.
 *
 * There is no login, so the guest's ability to check their own status /
 * download their own PDF later is authorized by `publicAccessToken` — an
 * unguessable value generated here and returned ONLY in this response. The
 * web form is expected to keep it (e.g. localStorage) and send it back on
 * later requests, the same way a session cookie would.
 */
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
        const rateLimit = checkOTPRateLimit(`public-esign-submit:${ip}`);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { success: false, message: rateLimit.message || 'Too many submissions from this connection. Please try again shortly.' },
                { status: 429 }
            );
        }

        await connectDB();
        const body = await request.json();
        const { personalDetails, documents, selections, signature } = body;

        // Same mandatory-field validation as the app's submit route.
        if (!signature?.clientName) {
            return NextResponse.json({ success: false, message: 'Digital Signature is required' }, { status: 400 });
        }
        if (!personalDetails?.fullName || !personalDetails?.email || !personalDetails?.mobile) {
            return NextResponse.json(
                { success: false, message: 'Name, email and mobile number are required' },
                { status: 400 }
            );
        }

        const publicAccessToken = ESignSubmission.generatePublicAccessToken();

        const newSubmission = await ESignSubmission.create({
            source: 'public_web',
            publicAccessToken,
            personalDetails,
            documents,
            selections,
            signature,
            adminStatus: 'Pending',
            pdfGenerated: false
        });

        return NextResponse.json({
            success: true,
            message: 'E-Sign form submitted successfully',
            submissionId: newSubmission._id,
            // 🔒 Only ever sent in this one response — store it client-side.
            accessToken: publicAccessToken
        });
    } catch (error) {
        console.error('Error submitting public esign form:', error);
        return NextResponse.json({ success: false, message: 'Failed to submit form' }, { status: 500 });
    }
}
