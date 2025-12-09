import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request) {
  try {
    await connectDB();
    
    // Get user ID from cookies or headers
    const cookies = request.headers.get('cookie');
    let userId = null;
    
    if (cookies) {
      const userCookie = cookies
        .split('; ')
        .find(row => row.startsWith('user='));
      
      if (userCookie) {
        try {
          const userDataStr = decodeURIComponent(userCookie.split('=')[1]);
          const userData = JSON.parse(userDataStr);
          userId = userData._id;
        } catch (parseError) {
          console.error('Failed to parse user cookie:', parseError);
        }
      }
    }
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return user data without sensitive fields
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.twoFactorOtp;
    delete userObj.resetOtp;
    
    return NextResponse.json({ 
      success: true, 
      data: userObj 
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get user data' },
      { status: 500 }
    );
  }
}