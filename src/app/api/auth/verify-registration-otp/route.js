import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/verify-registration-otp
 * Verify OTP and complete registration
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { email, otp, name, mobile, password } = body;



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
        const user = await User.findOne({ email });

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

        // Check OTP
        if (!user.registrationOtp || user.registrationOtp !== otp) {
            return NextResponse.json({
                success: false,
                message: 'Invalid OTP'
            }, { status: 400 });
        }

        // Check OTP expiry
        if (!user.registrationOtpExpiry || new Date() > user.registrationOtpExpiry) {
            return NextResponse.json({
                success: false,
                message: 'OTP has expired. Please request a new one.'
            }, { status: 400 });
        }

        // Hash password with bcrypt to match login logic
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate roll number using the new utility
        const { generateRollNumber, ensureUniqueRollNumber } = await import('@/utils/rollNumber');
        const rollNumber = await ensureUniqueRollNumber(User);

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

        await user.save();

        // Generate JWT token for auto-login
        const { signToken } = await import('@/utils/auth');
        const token = await signToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role
        });

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully! Registration complete.',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                rollNumber: user.rollNumber,
                role: user.role
            },
            token
        });

    } catch (error) {
        console.error('❌ Verify OTP Error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to verify OTP'
        }, { status: 500 });
    }
}
