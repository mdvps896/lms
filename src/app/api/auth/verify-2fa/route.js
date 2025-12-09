import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    await connectDB();
    const { userId, otp } = await request.json();
    
    if (!userId || !otp) {
      return NextResponse.json(
        { success: false, message: 'User ID and OTP are required' },
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
    
    // Check if OTP exists and hasn't expired
    if (!user.twoFactorOtp || !user.twoFactorOtpExpiry) {
      return NextResponse.json(
        { success: false, message: 'No verification code found' },
        { status: 400 }
      );
    }
    
    if (user.twoFactorOtpExpiry < new Date()) {
      // Clear expired OTP
      await User.findByIdAndUpdate(userId, {
        twoFactorOtp: null,
        twoFactorOtpExpiry: null
      });
      
      return NextResponse.json(
        { success: false, message: 'Verification code has expired' },
        { status: 400 }
      );
    }
    
    // Verify OTP
    if (user.twoFactorOtp !== otp) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification code' },
        { status: 400 }
      );
    }
    
    // Clear OTP after successful verification
    await User.findByIdAndUpdate(userId, {
      twoFactorOtp: null,
      twoFactorOtpExpiry: null
    });
    
    // Return complete user data
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.twoFactorOtp;
    delete userObj.resetOtp;
    
    return NextResponse.json({ 
      success: true, 
      data: userObj,
      message: 'Two-factor authentication successful'
    });
    
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Verification failed' },
      { status: 500 }
    );
  }
}