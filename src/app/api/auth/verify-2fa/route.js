import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/utils/auth';
import { sendPushNotification } from '@/utils/firebaseAdmin';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    let { userId, otp, deviceId } = body;

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
    const updateFields = {
      twoFactorOtp: null,
      twoFactorOtpExpiry: null
    };

    // Generate unique device ID if not provided (fallback)
    if (!deviceId) {
      const userAgent = request.headers.get('user-agent') || '';
      deviceId = Buffer.from(`${user.email}-${userAgent}-${Date.now()}`).toString('base64').substring(0, 32);
    }

    // 🔒 SECURITY: Device Login Tracking
    if (user.activeDeviceId && user.activeDeviceId !== deviceId) {
      // Notify previous device
      if (user.fcmToken) {
        sendPushNotification(
          user.fcmToken,
          'Security Alert',
          `New login detected on another device. You have been logged out from this device.`
        ).catch(err => console.error('Failed to send security alert:', err));
      }
    }

    updateFields.activeDeviceId = deviceId;
    updateFields.lastActiveAt = new Date();

    // Update User
    await User.findByIdAndUpdate(userId, updateFields);

    // Generate JWT Token
    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      deviceId: deviceId
    });

    // Return complete user data and token
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.twoFactorOtp;
    delete userObj.resetOtp;
    userObj.deviceId = deviceId;

    const response = NextResponse.json({
      success: true,
      data: userObj,
      token,
      message: 'Two-factor authentication successful'
    });

    // Set HttpOnly Cookie for web clients
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 365 * 24 * 60 * 60 // 365 days
    });

    return response;

  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Verification failed' },
      { status: 500 }
    );
  }
}
