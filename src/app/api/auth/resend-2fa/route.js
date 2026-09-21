import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendOtpEmail } from '@/utils/sendOtpEmail';
import { generateOtp, clearOtpAttempts } from '@/utils/otpAttempts';
import { checkOTPRateLimit } from '@/utils/otpRateLimit';

export async function POST(request) {
  try {
    await connectDB();
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // 🔒 Throttle resends — an unlimited resend loop is both an email-bombing
    // vector and a way to keep a fresh code alive indefinitely while guessing.
    const resendLimit = checkOTPRateLimit(`resend-2fa:${userId}`);
    if (!resendLimit.allowed) {
      return NextResponse.json(
        { success: false, message: resendLimit.message || 'Please wait before requesting another code.' },
        { status: 429 }
      );
    }

    // Generate new OTP
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Save OTP to database
    await User.findByIdAndUpdate(userId, {
      twoFactorOtp: otp,
      twoFactorOtpExpiry: otpExpiry
    });
    await clearOtpAttempts(User, userId, '2fa');
    
    // Send OTP email
    try {
      await sendOtpEmail(user.email, user.name, otp, 'Two-Factor Authentication (Resent)');
      
      return NextResponse.json({ 
        success: true, 
        message: 'New verification code sent to your email'
      });
      
    } catch (emailError) {
      console.error('Failed to resend 2FA OTP:', emailError);
      return NextResponse.json(
        { success: false, message: 'Failed to send verification code' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('2FA resend error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to resend verification code' },
      { status: 500 }
    );
  }
}