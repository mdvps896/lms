import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    await connectDB();
    const { userId, enabled } = await request.json();
    
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
    
    // Only allow admin users to enable/disable 2FA
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: '2FA is only available for admin users' },
        { status: 403 }
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