import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/utils/sendOtpEmail';
import { checkOTPRateLimit } from '@/utils/otpRateLimit';
import { signToken } from '@/utils/auth';

// Import all models in correct order to ensure proper registration
// Import all models in correct order to ensure proper registration
import { Category, User, Settings } from '@/models/init';
import { sendPushNotification } from '@/utils/firebaseAdmin';

// Input validation and sanitization
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  // Remove potential XSS and SQL injection characters
  return input.trim().replace(/[<>'"`;()]/g, '');
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    let { email, password, deviceId } = body;

    // 🔒 SECURITY: Input validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 🔒 SECURITY: Sanitize inputs
    email = sanitizeInput(email).toLowerCase();

    // 🔒 SECURITY: Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 🔒 SECURITY: Check password length
    if (password.length < 6 || password.length > 128) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 🔒 SECURITY: Rate limiting for login attempts
    const rateLimitCheck = checkOTPRateLimit(`login_${email}`);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json({
        success: false,
        message: `Too many login attempts. Please try again in ${rateLimitCheck.remainingTime} seconds.`,
        locked: true,
        remainingTime: rateLimitCheck.remainingTime
      }, { status: 429 });
    }



    // Check if models are registered


    // Get Global Settings for Security
    // import Settings first
    // const Settings = mongoose.models.Settings || mongoose.model('Settings'); // Removed redundant check
    let maxAttempts = 3;
    let lockoutDuration = 600; // seconds
    let securityEnabled = true;

    try {
      const settings = await Settings.findOne();
      if (settings && settings.security) {
        maxAttempts = settings.security.maxLoginAttempts || 3;
        // Check for lockoutUnit and calculate total seconds
        const unit = settings.security.lockoutUnit || 'minutes';
        const duration = settings.security.lockoutDuration || 600;

        lockoutDuration = duration;
        securityEnabled = settings.security.enabled !== false;
      }
    } catch (e) {

    }

    // Find user without populate to avoid Category registration issues
    const user = await User.findOne({ email });

    // Check if account is locked (Only if security is enabled)
    if (securityEnabled && user && user.lockUntil && user.lockUntil > Date.now()) {
      const remainingSeconds = Math.ceil((user.lockUntil - Date.now()) / 1000);
      return NextResponse.json(
        {
          success: false,
          message: `Please wait... your access blocked for security reasons. Try again in ${remainingSeconds} seconds.`,
          locked: true,
          remainingTime: remainingSeconds
        },
        { status: 403 }
      );
    }

    // If user has category, fetch it separately
    if (user && user.category) {
      try {
        const category = await Category.findById(user.category);
        if (category) {
          user.category = { _id: category._id, name: category.name };
        }
      } catch (catError) {
        console.warn('Could not fetch category:', catError.message);
        // Continue without category data
      }
    }



    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check email verification for students with local auth
    // Skip verification check for Google auth users, admins, and students with 'active' status
    if (user.role === 'student' && user.authProvider === 'local' && !user.emailVerified && user.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          message: 'Please verify your email first. Check your inbox for the verification code.',
          emailNotVerified: true,
          email: user.email
        },
        { status: 403 }
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

      }
    }

    if (!isPasswordValid) {

      if (securityEnabled && user.role === 'admin') {
        const attempts = (user.failedLoginAttempts || 0) + 1;
        const updates = { failedLoginAttempts: attempts };

        if (attempts >= maxAttempts) {
          updates.lockUntil = Date.now() + (lockoutDuration * 1000);
          updates.failedLoginAttempts = 0; // Reset count so next time after lock they start fresh? Or keep and just rely on lockUntil?

        }
        await User.findByIdAndUpdate(user._id, updates);

        if (attempts >= maxAttempts) {
          return NextResponse.json(
            {
              success: false,
              message: `Please wait... your access blocked for security reasons.`,
              locked: true,
              remainingTime: lockoutDuration
            },
            { status: 403 }
          );
        }
      }

      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Successful Login - Reset attempts
    if (user.role === 'admin' && (user.failedLoginAttempts > 0 || user.lockUntil)) {
      await User.findByIdAndUpdate(user._id, {
        failedLoginAttempts: 0,
        $unset: { lockUntil: 1 }
      });
    }

    // Check if user has 2FA enabled
    if (user.twoFactorEnabled) {
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

    // Generate unique device ID if not provided in body (fallback for web)
    if (!deviceId) {
      const userAgent = request.headers.get('user-agent') || '';
      deviceId = Buffer.from(`${email}-${userAgent}-${Date.now()}`).toString('base64').substring(0, 32);
    }

    // 🔒 SECURITY: Device Login Tracking & Lockout
    // Check if user is switching devices
    let updateFields = {
      activeDeviceId: deviceId,
      lastActiveAt: new Date()
    };

    if (user.activeDeviceId && user.activeDeviceId !== deviceId) {
      // User is logged in on another device -> Previous session invalidation happens by overwriting activeDeviceId

      // 1. Notify previous device (Real-time alert)
      if (user.fcmToken) {
        sendPushNotification(
          user.fcmToken,
          'Security Alert',
          `New login detected on another device. You have been logged out from this device.`
        ).catch(err => console.error('Failed to send security alert:', err));
      }

      // 2. Suspicious Activity Check (Multiple device switches)
      const DEVICE_CHANGE_LIMIT = 5; // Max switches allowed
      const DEVICE_CHANGE_WINDOW = 30 * 60 * 1000; // 30 minutes window

      const now = Date.now();
      let newCount = (user.deviceChangeCount || 0) + 1;
      let windowStart = user.deviceChangeWindowStart ? new Date(user.deviceChangeWindowStart).getTime() : now;

      // Reset window if expired
      if (now - windowStart > DEVICE_CHANGE_WINDOW) {
        newCount = 1;
        windowStart = now;
      }

      // Check if limit exceeded
      if (newCount > DEVICE_CHANGE_LIMIT) {
        const lockDuration = 30 * 60 * 1000; // 30 Minutes
        await User.findByIdAndUpdate(user._id, {
          lockUntil: new Date(now + lockDuration),
          deviceChangeCount: 0,
          deviceChangeWindowStart: null
        });

        return NextResponse.json({
          success: false,
          message: 'Account locked due to suspicious activity (multiple device logins). Try again in 30 minutes.',
          locked: true,
          remainingTime: 1800
        }, { status: 403 });
      }

      // Add tracking fields to update
      updateFields.deviceChangeCount = newCount;
      updateFields.deviceChangeWindowStart = new Date(windowStart);
    }

    // Update User with new device info
    await User.findByIdAndUpdate(user._id, updateFields);

    // Generate JWT Token
    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions: Array.isArray(user.permissions) ? [...user.permissions] : [],
      accessScope: user.accessScope || 'own',
      deviceId: deviceId // Add deviceId to token
    });

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.twoFactorOtp;
    delete userObj.resetOtp;

    // Add deviceId to response so mobile app can store it
    userObj.deviceId = deviceId;

    const response = NextResponse.json({ success: true, data: userObj, token });

    // Set HttpOnly Cookie for web clients
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 365 * 24 * 60 * 60 // 365 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'An error occurred during login',
        errorName: error.name,
        errorDetails: process.env.NODE_ENV === 'development' ? error.stack : 'Check server logs for details'
      },
      { status: 500 }
    );
  }
}
