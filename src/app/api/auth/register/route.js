import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';
import { sendEmail } from '@/lib/email';
import { checkOTPRateLimit } from '@/utils/otpRateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/register
 * Step 1: Send OTP to email for verification
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, mobile } = body;



    // Validation
    if (!name || !email || !mobile) {
      return NextResponse.json({
        success: false,
        message: 'Name, email, and mobile are required'
      }, { status: 400 });
    }

    // Check OTP rate limit
    const rateLimitCheck = checkOTPRateLimit(email);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json({
        success: false,
        message: rateLimitCheck.message,
        remainingTime: rateLimitCheck.remainingTime
      }, { status: 429 });
    }

    await connectDB();

    // Check if registration is enabled
    const db = mongoose.connection.db;
    const settings = await db.collection('settings').findOne({});
    const registrationEnabled = settings?.authPages?.enableRegistration ||
      settings?.loginRegister?.enableUserRegistration ||
      false;

    if (!registrationEnabled) {
      return NextResponse.json({
        success: false,
        message: 'User registration is currently disabled'
      }, { status: 403 });
    }

    // Check if user already exists and is verified
    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json({
        success: false,
        message: 'Email already registered. Please login instead.'
      }, { status: 400 });
    }

    // Check mobile number
    const existingMobile = await User.findOne({ phone: mobile, emailVerified: true });
    if (existingMobile) {
      return NextResponse.json({
        success: false,
        message: 'Mobile number already registered'
      }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user;
    // Create or update user with OTP (unverified)
    if (existingUser) {
      existingUser.name = name;
      existingUser.phone = mobile;
      existingUser.registrationOtp = otp;
      existingUser.registrationOtpExpiry = otpExpiry;
      await existingUser.save();
      user = existingUser;
    } else {
      user = await User.create({
        name,
        email,
        phone: mobile,
        password: 'temp', // Will be set during OTP verification
        registrationOtp: otp,
        registrationOtpExpiry: otpExpiry,
        emailVerified: false,
        role: 'student',
        authProvider: 'local'
      });
    }

    // Send OTP email
    const emailSent = await sendEmail({
      to: email,
      subject: 'Email Verification - Registration OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Our Platform!</h2>
          <p>Hello ${name},</p>
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
      message: 'OTP sent to your email. Please verify to complete registration.',
      requiresOtp: true,
      email,
      user: {
        _id: user._id,
        name,
        email,
        mobile
      }
    });

  } catch (error) {
    console.error('❌ Registration Error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Registration failed'
    }, { status: 500 });
  }
}
