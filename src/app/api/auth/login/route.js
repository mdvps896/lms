import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/utils/sendOtpEmail';

// Import Category first to ensure it's registered
import Category from '@/models/Category';
// Then import User model
import User from '@/models/User';

export async function POST(request) {
  try {
    await connectDB();
    
    // Force Category model to be registered by touching it
    mongoose.model('Category');
    
    const { email, password } = await request.json();
    
    console.log('Login attempt for:', email);
    
    // Check if models are registered
    console.log('Registered models:', Object.keys(mongoose.models));
    
    const user = await User.findOne({ email }).populate('category', 'name');
    
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check password - support both plain text (legacy) and hashed passwords
    let isPasswordValid = false;
    if (user.password.startsWith('$2')) {
      // BCrypt hashed password
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // Plain text password (legacy) - compare directly
      isPasswordValid = user.password === password;
      
      // If valid, hash the password for future logins
      if (isPasswordValid) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.findByIdAndUpdate(user._id, { password: hashedPassword });
        console.log('Password hashed for user:', user.email);
      }
    }

    if (!isPasswordValid) {
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
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined },
      { status: 500 }
    );
  }
}
