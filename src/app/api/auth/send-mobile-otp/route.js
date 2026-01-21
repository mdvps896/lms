import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/init';
import Settings from '@/models/Settings';

/**
 * POST /api/auth/send-mobile-otp
 * Check if user exists and if registration is enabled
 * (Firebase handles actual OTP sending)
 */
export async function POST(request) {
    try {
        await connectDB();

        const { mobile, platform = 'app' } = await request.json();

        // Validate mobile number
        if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
            return NextResponse.json(
                { success: false, message: 'Valid 10-digit mobile number is required' },
                { status: 400 }
            );
        }

        // Check if mobile OTP is enabled for app
        const settings = await Settings.findOne();
        if (platform === 'app' && settings?.authSettings?.app?.enableMobileOTP === false) {
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

        // Send OTP via 2Factor.in
        const apiKey = process.env.TWOTACTOR_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { success: false, message: 'SMS Gateway not configured' },
                { status: 500 }
            );
        }

        try {
            // Try using the default system template if no custom template is approved
            const twoFactorUrl = `https://2factor.in/API/V1/${apiKey}/SMS/${mobile}/AUTOGEN`;
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
                isNewUser
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
