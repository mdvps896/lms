import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/utils/apiAuth';
import { verifyFirebaseToken } from '@/lib/firebase-admin';
import { checkOTPRateLimit } from '@/utils/otpRateLimit';
import { getAppOtpSettings, verifyGatewayOtp } from '@/lib/otpGateway';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        await connectDB();

        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        let { mobile } = body;

        if (!mobile) {
            return NextResponse.json({ success: false, message: 'Mobile number is required' }, { status: 400 });
        }
        mobile = String(mobile);

        // When Mobile OTP is on for the app, a number may only be attached to an
        // account after the OTP for it has been verified (Google users get this
        // as a second verification step). Older app builds only send `mobile`;
        // they keep working while Mobile OTP is off.
        const otpSettings = await getAppOtpSettings();
        if (otpSettings.enabled) {
            if (!/^[0-9]{10}$/.test(mobile)) {
                return NextResponse.json({ success: false, message: 'Valid 10-digit mobile number is required' }, { status: 400 });
            }

            const attempts = checkOTPRateLimit(`verify-phone:${user.id}`, { maxAttempts: 5 });
            if (!attempts.allowed) {
                return NextResponse.json(
                    { success: false, message: attempts.message || 'Too many attempts. Please try again shortly.' },
                    { status: 429 }
                );
            }

            let verified = false;
            if (body.firebaseToken) {
                const result = await verifyFirebaseToken(body.firebaseToken);
                verified = !!result?.success && String(result.phoneNumber || '').replace(/^\+91/, '') === mobile;
            } else if (body.otp && /^[0-9]{4,9}$/.test(String(body.otp))) {
                const result = await verifyGatewayOtp(mobile, String(body.otp), body.sessionId);
                verified = !!result.success;
            }
            if (!verified) {
                return NextResponse.json(
                    { success: false, message: 'Invalid or expired OTP' },
                    { status: 401 }
                );
            }
        }

        // Check if mobile already exists for another user
        const existingUser = await User.findOne({ phone: mobile, _id: { $ne: user.id } });
        if (existingUser) {
            return NextResponse.json({ success: false, message: 'Mobile number already in use' }, { status: 400 });
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            user.id,
            { phone: mobile },
            { new: true }
        ).select('-password');

        return NextResponse.json({
            success: true,
            message: 'Mobile number updated',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update mobile error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
