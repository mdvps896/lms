import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { checkOtpAttempts, recordFailedOtpAttempt, clearOtpAttempts, otpMatches } from '@/utils/otpAttempts';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/verify-registration-otp
 * Verify OTP and complete registration
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { email, otp, name, mobile, password, category, gender } = body;
        console.log(`\x1b[33m[AUTH] OTP Verification for: ${email}\x1b[0m`);
        console.log(`\x1b[36m[DEBUG] Category Received: ${category}\x1b[0m`);
        console.log(`\x1b[36m[DEBUG] Gender Received: ${gender}\x1b[0m`);



        if (!email || !otp) {
            return NextResponse.json({
                success: false,
                message: 'Email and OTP are required'
            }, { status: 400 });
        }

        if (!password) {
            return NextResponse.json({
                success: false,
                message: 'Password is required'
            }, { status: 400 });
        }

        await connectDB();

        // Find user
        // 🔒 Coerce to a primitive string before it reaches Mongo. An object such
        // as {"$ne": null} sent in the JSON body would otherwise be
        // interpreted as a query OPERATOR and match an arbitrary account.
        const user = await User.findOne({ email: String(email || '') });

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found. Please request OTP again.'
            }, { status: 404 });
        }

        // Check if already verified
        if (user.emailVerified) {
            return NextResponse.json({
                success: false,
                message: 'Email already verified'
            }, { status: 400 });
        }

        // 🔒 SECURITY: cap guesses — this endpoint is public and used to allow
        // unlimited attempts against a 6-digit code.
        if (checkOtpAttempts(user, 'registration').exceeded) {
            return NextResponse.json({
                success: false,
                message: 'Too many incorrect codes. Please request a new one.'
            }, { status: 429 });
        }

        const otpExpired = !user.registrationOtpExpiry || new Date() > user.registrationOtpExpiry;
        if (!user.registrationOtp || otpExpired || !otpMatches(user.registrationOtp, String(otp))) {
            const result = await recordFailedOtpAttempt(
                User,
                user._id,
                'registration',
                ['registrationOtp', 'registrationOtpExpiry']
            );
            return NextResponse.json({
                success: false,
                message: result.exceeded
                    ? 'Too many incorrect codes. Please request a new one.'
                    : 'Invalid or expired OTP',
                attemptsLeft: result.attemptsLeft
            }, { status: result.exceeded ? 429 : 400 });
        }

        // 🔒 Minimum password strength on the account-creation path.
        if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
            return NextResponse.json({
                success: false,
                message: 'Password must be between 8 and 128 characters.'
            }, { status: 400 });
        }

        await clearOtpAttempts(User, user._id, 'registration');

        // Hash password with bcrypt to match login logic
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate roll number using the new utility
        const { generateRollNumber, ensureUniqueRollNumber } = await import('@/utils/rollNumber');
        const rollNumber = await ensureUniqueRollNumber(User, name || user.name);

        // Determine register source
        const source = body.source || body.registerSource || 'app'; // Default to app for this flow if not specified


        // Update user with complete details
        user.name = name;
        user.phone = mobile;
        user.password = hashedPassword;
        user.rollNumber = rollNumber;
        user.emailVerified = true;
        user.registrationOtp = null;
        user.registrationOtpExpiry = null;
        user.registerSource = source;
        user.isActive = true;
        user.authProvider = 'local';
        user.activeDeviceId = body.deviceId || '';
        user.lastActiveAt = new Date();

        if (category || !user.category) user.category = category || '6970d3edf4cd7a96ffd86faa';
        if (gender) user.gender = gender;
        
        console.log(`\x1b[32m[DEBUG] Saving User with Category: ${user.category}, Gender: ${user.gender}\x1b[0m`);

        await user.save();

        // Generate JWT token for auto-login
        const { signToken, signRefreshToken } = await import('@/utils/auth');
        const token = await signToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            permissions: Array.isArray(user.permissions) ? [...user.permissions] : [],
            accessScope: user.accessScope || 'own',
            deviceId: body.deviceId || ''
        });

        // Generate Refresh Token with full profile
        const refreshToken = await signRefreshToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            permissions: Array.isArray(user.permissions) ? [...user.permissions] : [],
            accessScope: user.accessScope || 'own',
            deviceId: body.deviceId || ''
        });

        // Send Admin Notification (Async - do not block response)
        try {
            const { sendAdminNewUserRegistryNotification } = await import('@/lib/sendAdminNotification');
            sendAdminNewUserRegistryNotification(user);
        } catch (notifErr) {
            console.error('Failed to trigger admin notification:', notifErr);
        }

        const response = NextResponse.json({
            success: true,
            message: 'Email verified successfully! Registration complete.',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                rollNumber: user.rollNumber,
                role: user.role,
                category: user.category,
                gender: user.gender
            },
            token,
            refreshToken
        });

        // Auto-login on the web needs the session cookies set HttpOnly here.
        // The client only wrote a non-HttpOnly 'user' cookie, which is no
        // longer an authorization input — without these a freshly registered
        // user was bounced straight back to the login page.
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 2 * 60 * 60
        });
        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60
        });

        return response;

    } catch (error) {
        console.error('❌ Verify OTP Error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to verify OTP'
        }, { status: 500 });
    }
}
