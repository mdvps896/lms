import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendOtpEmail } from '@/utils/sendOtpEmail';

export async function POST(request) {
  try {
    await connectDB();
    const { email, password } = await request.json();
    
    const user = await User.findOne({ email }).populate('category', 'name');
    
    if (!user || user.password !== password) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Check if user has 2FA enabled and is admin
    if (user.twoFactorEnabled && user.role === 'admin') {
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Save OTP to database
      await User.findByIdAndUpdate(user._id, {
        twoFactorOtp: otp,
        twoFactorOtpExpiry: otpExpiry
      });
      
      // Send OTP email
      try {
        await sendOtpEmail(user.email, user.name, otp, 'Two-Factor Authentication');
      } catch (emailError) {
        console.error('Failed to send 2FA OTP:', emailError);
        return NextResponse.json(
          { success: false, message: 'Failed to send verification code' },
          { status: 500 }
        );
      }
      
      // Return partial user data indicating 2FA is required
      return NextResponse.json({ 
        success: true, 
        requiresTwoFactor: true,
        userId: user._id,
        email: user.email,
        message: 'OTP sent to your email for two-factor authentication'
      });
    }
    
    // Normal login flow for users without 2FA or non-admin users
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.twoFactorOtp;
    delete userObj.resetOtp;
    
    return NextResponse.json({ success: true, data: userObj });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
