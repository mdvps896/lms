import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/utils/sendOtpEmail';

// Import all models in correct order to ensure proper registration
// Import all models in correct order to ensure proper registration
import { Category, User, Settings } from '@/models/init';

export async function POST(request) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    console.log('Login attempt for:', email);

    // Check if models are registered
    console.log('Registered models:', Object.keys(mongoose.models));

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

        // Settings stores the RAW value entered by user, but default logic treated it as seconds?
        // Wait, in SecuritySMTPSettings.jsx we saw logic:
        // onChange={(e) => handleSecurityChange('lockoutDuration', (parseInt(e.target.value) || 10) * 60)} for minutes
        // AND validation logic in the NEW code I added handles seconds/minutes/hours conversion and saves as SECONDS.
        // So `settings.security.lockoutDuration` should ALREADY be in seconds.

        lockoutDuration = duration;
        securityEnabled = settings.security.enabled !== false;
      }
    } catch (e) {
      console.log('Failed to fetch security settings, using defaults');
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

    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check email verification for students with local auth
    // Skip verification check for Google auth users and admins
    if (user.role === 'student' && user.authProvider === 'local' && !user.emailVerified) {
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
        console.log('Password hashed for user:', user.email);
      }
    }

    if (!isPasswordValid) {
      // Increment failed attempts for ADMIN only or all users? User requested "admin login".
      // Let's apply to admin role users for now as requested.
      // Increment failed attempts for ADMIN only or all users? User requested "admin login".
      // Let's apply to admin role users for now as requested.
      if (securityEnabled && user.role === 'admin') {
        const attempts = (user.failedLoginAttempts || 0) + 1;
        const updates = { failedLoginAttempts: attempts };

        if (attempts >= maxAttempts) {
          updates.lockUntil = Date.now() + (lockoutDuration * 1000);
          updates.failedLoginAttempts = 0; // Reset count so next time after lock they start fresh? Or keep and just rely on lockUntil?
          // Standard is to keep until successful login or admin reset, but simpler is reset count after locking so they get another fresh set of tries after wait.
          // Actually, resetting 'failedLoginAttempts' to 0 immediately might unlock if we only check counts.
          // But we check 'lockUntil', so resetting 'failedLoginAttempts' to 0 is fine, OR better logic:
          // Keep failedLoginAttempts at max to indicate history, but 'lockUntil' governs access.
          // Logic used here: If locked, we return early. If not locked and wrong password, we increment.
          // If we reach limit, we set lock.
          // When successfully logged in, we reset both.
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
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.twoFactorOtp;
    delete userObj.resetOtp;

    return NextResponse.json({ success: true, data: userObj });
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
