import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/init';
import { signToken } from '@/utils/auth';
import { verifyFirebaseToken } from '@/lib/firebase-admin';
import { verifyMsg91Otp } from '@/lib/msg91';
import { checkOTPRateLimit } from '@/utils/otpRateLimit';

/**
 * POST /api/auth/verify-mobile-login
 * Verify Firebase ID token and login/register user based on phone number
 */
export async function POST(request) {
    try {
        await connectDB();

        const { firebaseToken, name, deviceId, mobile: mobileNumber, otp, sessionId, platform: rawPlatform } = await request.json();
        const platform = rawPlatform === 'web' ? 'web' : 'app';

        let mobile = mobileNumber;

        // If firebaseToken is provided, use Firebase verification (optional backward compatibility)
        if (firebaseToken) {
            const verificationResult = await verifyFirebaseToken(firebaseToken);

            // verifyFirebaseToken returns { success: false } on a bad token
            // rather than throwing. This wasn't checked, so an invalid token
            // hit `undefined.replace` and surfaced as a 500 instead of a 401.
            if (!verificationResult?.success || !verificationResult.phoneNumber) {
                return NextResponse.json(
                    { success: false, message: 'Invalid or expired verification token' },
                    { status: 401 }
                );
            }

            mobile = verificationResult.phoneNumber.replace(/^\+91/, '');
        }
        // Otherwise verify through the SMS gateway configured for this platform
        else if (mobileNumber && otp) {
            if (!/^[0-9]{10}$/.test(String(mobileNumber)) || !/^[0-9]{4,9}$/.test(String(otp))) {
                return NextResponse.json(
                    { success: false, message: 'Invalid mobile number or OTP' },
                    { status: 400 }
                );
            }

            const Settings = require('@/models/Settings').default;
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

            const smsProvider = platformSettings?.smsProvider || (platform === 'web' ? 'msg91' : 'firebase');

            // Brute-force guard: a 6-digit OTP is only safe if guesses are capped.
            const verifyLimit = checkOTPRateLimit(`verify-mobile-otp:${mobileNumber}`, { maxAttempts: 5 });
            if (!verifyLimit.allowed) {
                return NextResponse.json(
                    { success: false, message: verifyLimit.message || 'Too many attempts. Please try again shortly.' },
                    { status: 429 }
                );
            }

            if (smsProvider === 'msg91') {
                const verified = await verifyMsg91Otp(String(mobileNumber), String(otp), sessionId);
                if (!verified.success) {
                    return NextResponse.json(
                        { success: false, message: verified.message || 'Invalid OTP or expired session' },
                        { status: 401 }
                    );
                }
                mobile = String(mobileNumber);
            } else {
                // 2Factor.in
                const apiKey = platformSettings?.twoFactorApiKey
                    || settings?.authSettings?.app?.twoFactorApiKey
                    || process.env.TWOFACTOR_API_KEY;

                if (!apiKey) {
                    return NextResponse.json(
                        { success: false, message: 'SMS Gateway configuration missing' },
                        { status: 500 }
                    );
                }

                // 🔒 sessionId and otp go straight into a URL path. Without
                // validation, a value containing '/' or '..' could redirect the
                // request to a different endpoint on the gateway.
                if (!sessionId || !/^[A-Za-z0-9-]{1,64}$/.test(String(sessionId))) {
                    return NextResponse.json(
                        { success: false, message: 'Invalid OTP or session' },
                        { status: 400 }
                    );
                }

                const verifyUrl = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/VERIFY/${encodeURIComponent(sessionId)}/${encodeURIComponent(otp)}`;

                try {
                    const verifyResponse = await fetch(verifyUrl);
                    const verifyData = await verifyResponse.json();

                    if (verifyData.Status !== 'Success') {
                        return NextResponse.json(
                            { success: false, message: 'Invalid OTP or expired session' },
                            { status: 401 }
                        );
                    }
                    mobile = mobileNumber; // Ensure mobile is set
                } catch (error) {
                    console.error('2Factor Verification Error:', error);
                    return NextResponse.json(
                        { success: false, message: 'OTP verification failed' },
                        { status: 500 }
                    );
                }
            }
        } else {
            return NextResponse.json(
                { success: false, message: 'Mobile and OTP are required' },
                { status: 400 }
            );
        }

        // Find or create user by mobile number
        // 🔒 Coerce to a primitive string before it reaches Mongo. An object such
        // as {"$ne": null} sent in the JSON body would otherwise be
        // interpreted as a query OPERATOR and match an arbitrary account.
        let user = await User.findOne({ phone: String(mobile || '') });

        // 🔒 SECURITY: Check account status for existing users
        if (user && (user.status === 'inactive' || user.status === 'suspended')) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Your account is currently ${user.status}. Please contact the administrator.`
                },
                { status: 403 }
            );
        }

        let isNewUser = false;

        if (!user) {
            // Create new user — but only where registration is open for this
            // platform (send-mobile-otp checks too; this covers direct calls).
            const authSettings = (await require('@/models/Settings').default.findOne())?.authSettings;
            const registrationEnabled = platform === 'web'
                ? authSettings?.web?.enableRegistration ?? true
                : authSettings?.app?.enableRegistration ?? true;
            if (!registrationEnabled) {
                return NextResponse.json(
                    { success: false, message: 'Registration is currently disabled' },
                    { status: 403 }
                );
            }

            isNewUser = true;

            // Generate roll number for new user
            const { ensureUniqueRollNumber } = await import('@/utils/rollNumber');
            const rollNumber = await ensureUniqueRollNumber(User, name || `User ${mobile}`);

            user = await User.create({
                name: name || `User ${mobile}`,
                email: `${mobile}@mobile.local`,
                phone: mobile,
                rollNumber,
                role: 'student',
                isActive: true,
                emailVerified: true, // Auto-verify for mobile OTP users
                registerSource: platform,
                authProvider: 'mobile',
                password: Buffer.from(`${mobile}-${Date.now()}`).toString('base64') // Random password
            });
        } else if (!user.isActive) {
            // Activate existing inactive user
            isNewUser = true;

            // Generate roll number
            const { ensureUniqueRollNumber } = await import('@/utils/rollNumber');
            const rollNumber = await ensureUniqueRollNumber(User, name || user.name || `User ${mobile}`);

            await User.findByIdAndUpdate(user._id, {
                name: name || user.name || `User ${mobile}`,
                email: user.email || `${mobile}@mobile.local`,
                rollNumber,
                isActive: true,
                emailVerified: true,
                registerSource: platform,
                authProvider: 'mobile'
            });

            // Refresh user data
            user = await User.findById(user._id);
        }

        // Update device tracking
        const finalDeviceId = deviceId || Buffer.from(`${mobile}-${Date.now()}`).toString('base64').substring(0, 32);

        await User.findByIdAndUpdate(user._id, {
            activeDeviceId: finalDeviceId,
            lastActiveAt: new Date()
        });

        // Generate JWT Access Token with full profile and deviceId
        const token = await signToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            permissions: Array.isArray(user.permissions) ? [...user.permissions] : [],
            accessScope: user.accessScope || 'own',
            deviceId: finalDeviceId
        });

        const { signRefreshToken } = await import('@/utils/auth');

        // Generate Refresh Token with full profile for secure auto-refresh
        const refreshToken = await signRefreshToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            permissions: Array.isArray(user.permissions) ? [...user.permissions] : [],
            accessScope: user.accessScope || 'own',
            deviceId: finalDeviceId
        });

        // Prepare user object for response
        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.mobileOtp;
        delete userObj.mobileOtpExpiry;
        delete userObj.twoFactorOtp;
        delete userObj.resetOtp;

        console.log(`\x1b[32m[AUTH] Mobile Login Successful: ${user.phone}\x1b[0m`);

        const response = NextResponse.json({
            success: true,
            isNewUser,
            message: isNewUser ? 'Registration successful' : 'Login successful',
            data: userObj,
            token,
            refreshToken
        });

        // Web sessions live in HttpOnly cookies, matching /api/auth/login.
        if (platform === 'web') {
            response.cookies.set('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 2 * 60 * 60 // matches the 2h access token TTL
            });
            response.cookies.set('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 // matches the 30d refresh token TTL
            });
        }

        return response;

    } catch (error) {
        console.error('Error verifying mobile login:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to verify OTP' },
            { status: 500 }
        );
    }
}
