import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/init';
import Settings from '@/models/Settings';
import { checkOTPRateLimit } from '@/utils/otpRateLimit';
import { sendMsg91Otp } from '@/lib/msg91';

/**
 * POST /api/auth/send-mobile-otp
 * Check if user exists and if registration is enabled
 * (Firebase handles actual OTP sending)
 */
export async function POST(request) {
    try {
        await connectDB();

        const { mobile, platform = 'app', channel } = await request.json();

        // Validate mobile number
        if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
            return NextResponse.json(
                { success: false, message: 'Valid 10-digit mobile number is required' },
                { status: 400 }
            );
        }

        // 🔒 Every call past this point can send a real, billable SMS via the
        // 2Factor.in gateway. Unthrottled, this endpoint is an SMS-bombing and
        // direct-billing-abuse vector.
        const smsLimit = checkOTPRateLimit(`mobile-otp:${mobile}`);
        if (!smsLimit.allowed) {
            return NextResponse.json(
                { success: false, message: smsLimit.message || 'Too many requests. Please try again shortly.' },
                { status: 429 }
            );
        }

        // Mobile OTP is switched on per platform in Settings → Login & Register
        // Settings. The app keeps its old "only off when explicitly false"
        // behaviour; web is opt-in.
        const settings = await Settings.findOne();
        const platformSettings = platform === 'web'
            ? settings?.authSettings?.web
            : settings?.authSettings?.app;
        const otpEnabled = platform === 'web'
            ? platformSettings?.enableMobileOTP === true
            : platformSettings?.enableMobileOTP !== false;
        if (!otpEnabled) {
            return NextResponse.json(
                { success: false, message: 'Mobile OTP login is not enabled' },
                { status: 403 }
            );
        }

        // Check if user exists with this mobile number
        const user = await User.findOne({ phone: mobile });
        let isNewUser = false;

        if (!user) {
            // Check if registration is enabled
            const registrationEnabled = platform === 'app'
                ? settings?.authSettings?.app?.enableRegistration ?? true
                : settings?.authSettings?.web?.enableRegistration ?? true;

            if (!registrationEnabled) {
                return NextResponse.json(
                    { success: false, message: 'Registration is currently disabled' },
                    { status: 403 }
                );
            }

            isNewUser = true;
        }

        // Check SMS Provider Setting. Web has no Firebase phone-auth flow, so its
        // default is MSG91.
        const smsProvider = platformSettings?.smsProvider || (platform === 'web' ? 'msg91' : 'firebase');

        if (smsProvider === 'msg91') {
            // `channel` is 'sms' | 'whatsapp'; omitted → first enabled channel
            // (older app builds never send it).
            const sent = await sendMsg91Otp(mobile, channel === 'sms' || channel === 'whatsapp' ? channel : undefined);
            if (!sent.success) {
                return NextResponse.json({ success: false, message: sent.message }, { status: 500 });
            }
            return NextResponse.json({
                success: true,
                message: 'OTP sent successfully',
                // Encodes channel + MSG91 request id, signed against this mobile.
                sessionId: sent.sessionId,
                channel: sent.channel,
                isNewUser,
                provider: 'msg91'
            });
        }

        if (platform === 'web' && smsProvider === 'firebase') {
            return NextResponse.json(
                { success: false, message: 'Select an SMS provider for web in Login & Register Settings' },
                { status: 400 }
            );
        }

        // If provider is configured as Firebase in backend, but this API is called, 
        // it means the client is either old or expecting backend-triggered OTP (which Firebase doesn't do via this API usually).
        // For backward compatibility or if client enforces checking:
        if (smsProvider === 'firebase') {
            // For Firebase, we just return success so client can proceed with client-side auth
            // checks for user existence are already done above
            return NextResponse.json({
                success: true,
                message: 'Proceed with Firebase Auth',
                isNewUser,
                provider: 'firebase'
            });
        }

        // Send OTP via 2Factor.in
        // Prioritize API key from settings, then env
        const apiKey = platformSettings?.twoFactorApiKey
            || settings?.authSettings?.app?.twoFactorApiKey
            || process.env.TWOFACTOR_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { success: false, message: 'SMS Gateway not configured (API Key missing)' },
                { status: 500 }
            );
        }

        try {
            // Use custom template if provided, else AUTOGEN
            const templateName = platformSettings?.twoFactorTemplateName
                || settings?.authSettings?.app?.twoFactorTemplateName
                || 'AUTOGEN';
            const twoFactorUrl = `https://2factor.in/API/V1/${apiKey}/SMS/${mobile}/${templateName}`;
            const otpResponse = await fetch(twoFactorUrl);
            const otpData = await otpResponse.json();

            if (otpData.Status !== 'Success') {
                return NextResponse.json(
                    { success: false, message: 'Failed to send OTP via SMS Gateway' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'OTP sent successfully',
                sessionId: otpData.Details, // We need this to verify later
                isNewUser,
                provider: '2factor'
            });
        } catch (smsError) {
            console.error('SMS Gateway Error:', smsError);
            return NextResponse.json(
                { success: false, message: 'SMS Gateway error' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Error checking mobile number:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to process request' },
            { status: 500 }
        );
    }
}
