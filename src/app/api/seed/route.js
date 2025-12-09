import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST() {
  try {
    await connectDB();
    
    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Database already has users' 
      });
    }

    const defaultUsers = [
      {
        name: 'Admin User',
        email: 'admin@duralux.com',
        username: 'admin',
        phone: '9999999999',
        password: 'admin123',
        role: 'admin',
        status: 'active',
        emailVerified: true,
      },
      {
        name: 'Teacher User',
        email: 'teacher@duralux.com',
        username: 'teacher',
        phone: '8888888888',
        password: 'teacher123',
        role: 'teacher',
        status: 'active',
        emailVerified: true,
      },
      {
        name: 'Student User',
        email: 'student@duralux.com',
        username: 'student',
        phone: '9876543210',
        password: 'student123',
        role: 'student',
        status: 'active',
        emailVerified: true,
      }
    ];

    await User.insertMany(defaultUsers);

    return NextResponse.json({ 
      success: true, 
      message: 'Default users seeded successfully',
      count: defaultUsers.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
