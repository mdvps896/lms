import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export async function POST(request) {
  try {
    await connectDB();
    // 🔒 SECURITY: act on the caller's own account, taken from the verified
    // JWT. This used to trust a `userId` sent in the request body, so any
    // authenticated user could target somebody else's account (e.g. switch
    // another user's 2FA off, or repoint their push notifications).
    const currentUser = await getAuthenticatedUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = currentUser.id || currentUser._id?.toString();
    const { enabled } = await request.json();

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



    // Update 2FA status
    await User.findByIdAndUpdate(userId, {
      twoFactorEnabled: enabled === true,
      // Clear any existing OTP when disabling 2FA
      ...(enabled !== true && {
        twoFactorOtp: null,
        twoFactorOtpExpiry: null
      })
    });

    return NextResponse.json({
      success: true,
      message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`,
      twoFactorEnabled: enabled === true
    });

  } catch (error) {
    console.error('2FA toggle error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update 2FA settings' },
      { status: 500 }
    );
  }
}