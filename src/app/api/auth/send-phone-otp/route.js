import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/utils/apiAuth';
import { checkOTPRateLimit } from '@/utils/otpRateLimit';
import { sendGatewayOtp } from '@/lib/otpGateway';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/send-phone-otp   (logged-in users)
 * Step 1 of verifying a mobile number for an account that signed in another
 * way (e.g. Google). Body: { mobile (10 digits), channel? 'sms' | 'whatsapp' }.
 * Step 2 is POST /api/auth/update-mobile with the OTP.
 */
export async function POST(request) {
    try {
        await connectDB();

        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const userId = user.id || user._id?.toString();

        const { mobile, channel } = await request.json();
        if (!mobile || !/^[0-9]{10}$/.test(String(mobile))) {
            return NextResponse.json(
                { success: false, message: 'Valid 10-digit mobile number is required' },
                { status: 400 }
            );
        }

        // Every send is billable — same throttle as the login OTP.
        const limit = checkOTPRateLimit(`phone-otp:${mobile}`);
        if (!limit.allowed) {
            return NextResponse.json(
                { success: false, message: limit.message || 'Too many requests. Please try again shortly.' },
                { status: 429 }
            );
        }

        // Fail early (before sending an SMS) if another account owns this number.
        const owner = await User.findOne({ phone: String(mobile), _id: { $ne: userId } }).select('_id').lean();
        if (owner) {
            return NextResponse.json(
                { success: false, message: 'This mobile number is already registered with another account' },
                { status: 400 }
            );
        }

        const sent = await sendGatewayOtp(String(mobile), channel);
        if (!sent.success) {
            return NextResponse.json({ success: false, message: sent.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'OTP sent successfully',
            provider: sent.provider,
            sessionId: sent.sessionId,
            channel: sent.channel
        });
    } catch (error) {
        console.error('Send phone OTP error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
