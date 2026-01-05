import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendEmail } from '@/lib/email';

import { checkOTPRateLimit } from '@/utils/otpRateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/send-registration-otp
 * Send OTP to email for registration verification
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { email, name } = body;



        if (!email) {
            return NextResponse.json({
                success: false,
                message: 'Email is required'
            }, { status: 400 });
        }

        // 🔒 SECURITY: Rate Limiting
        const rateLimit = checkOTPRateLimit(email);
        if (!rateLimit.allowed) {
            return NextResponse.json({
                success: false,
                message: rateLimit.message
            }, { status: 429 });
        }

        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.emailVerified) {
            return NextResponse.json({
                success: false,
                message: 'Email already registered and verified'
            }, { status: 400 });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save or update user with OTP
        if (existingUser) {
            existingUser.registrationOtp = otp;
            existingUser.registrationOtpExpiry = otpExpiry;
            await existingUser.save();
        } else {
            // Create temporary user record
            await User.create({
                name: name || 'User',
                email,
                password: 'temp', // Will be updated during verification
                registrationOtp: otp,
                registrationOtpExpiry: otpExpiry,
                emailVerified: false,
                role: 'student'
            });
        }

        // Send OTP email
        const emailSent = await sendEmail({
            to: email,
            subject: 'Email Verification - Registration OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Email Verification</h2>
                    <p>Hello ${name || 'User'},</p>
                    <p>Thank you for registering! Please use the following OTP to verify your email:</p>
                    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #4CAF50; margin: 0; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
                    </div>
                    <p>This OTP will expire in 10 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">This is an automated email. Please do not reply.</p>
                </div>
            `
        });

        if (!emailSent) {
            return NextResponse.json({
                success: false,
                message: 'Failed to send OTP email. Please check email settings.'
            }, { status: 500 });
        }



        return NextResponse.json({
            success: true,
            message: 'OTP sent to your email',
            email
        });

    } catch (error) {
        console.error('❌ Send OTP Error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to send OTP'
        }, { status: 500 });
    }
}
