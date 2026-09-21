import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, signRefreshToken } from '@/utils/auth';
import { checkOtpAttempts, recordFailedOtpAttempt, clearOtpAttempts, otpMatches } from '@/utils/otpAttempts';
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

    // 🔒 SECURITY: cap guesses. This endpoint is public and previously allowed
    // unlimited attempts against a 6-digit code inside a 10-minute window,
    // i.e. 2FA could be brute-forced with nothing more than the userId that
    // the login response hands out.
    const attemptState = checkOtpAttempts(user, '2fa');
    if (attemptState.exceeded) {
      return NextResponse.json(
        { success: false, message: 'Too many incorrect codes. Please sign in again to get a new one.' },
        { status: 429 }
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

    // Verify OTP (constant-time, so response timing can't leak a prefix)
    if (!otpMatches(user.twoFactorOtp, String(otp))) {
      const result = await recordFailedOtpAttempt(
        User,
        userId,
        '2fa',
        ['twoFactorOtp', 'twoFactorOtpExpiry']
      );
      return NextResponse.json(
        {
          success: false,
          message: result.exceeded
            ? 'Too many incorrect codes. Please sign in again to get a new one.'
            : 'Invalid verification code',
          attemptsLeft: result.attemptsLeft
        },
        { status: result.exceeded ? 429 : 400 }
      );
    }

    await clearOtpAttempts(User, userId, '2fa');

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

    // Generate JWT Access Token
    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions: Array.isArray(user.permissions) ? [...user.permissions] : [],
      accessScope: user.accessScope || 'own',
      deviceId: deviceId
    });

    // Generate Refresh Token with full profile
    const refreshToken = await signRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions: Array.isArray(user.permissions) ? [...user.permissions] : [],
      accessScope: user.accessScope || 'own',
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
      refreshToken,
      message: 'Two-factor authentication successful'
    });

    // Set HttpOnly cookies for web clients, matching /api/auth/login.
    // The refresh cookie was missing here, so a 2FA user had no way to renew
    // their (now short-lived) access token and got logged out after 2 hours.
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

    return response;

  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Verification failed' },
      { status: 500 }
    );
  }
}
