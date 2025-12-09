import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Settings from '@/models/Settings';

// Helper function to generate roll number
async function generateRollNumber() {
  try {
    const settings = await Settings.findOne({});
    
    if (!settings || !settings.rollNumberSettings || !settings.rollNumberSettings.enabled) {
      return null; // Roll number generation disabled
    }

    const { prefix, currentNumber, digitLength } = settings.rollNumberSettings;
    
    // Format the number with leading zeros
    const formattedNumber = String(currentNumber).padStart(digitLength, '0');
    const rollNumber = `${prefix}${formattedNumber}`;
    
    // Increment current number for next user
    await Settings.updateOne(
      {},
      { $inc: { 'rollNumberSettings.currentNumber': 1 } }
    );
    
    return rollNumber;
  } catch (error) {
    console.error('Error generating roll number:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 400 }
      );
    }
    
    // Generate roll number for new user
    const rollNumber = await generateRollNumber();
    
    // Create new user with student role by default
    const userData = {
      ...body,
      role: body.role || 'student',
      rollNumber: rollNumber, // Assign roll number
    };
    
    const user = await User.create(userData);
    const userObj = user.toObject();
    delete userObj.password;
    
    return NextResponse.json({ success: true, data: userObj }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
