import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import Category from '@/models/Category';

// GET all users
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const category = searchParams.get('category');
    const populate = searchParams.get('populate');

    let query = { isDeleted: { $ne: true } };
    if (role) {
      query.role = role;
    }
    if (category) {
      query.category = category;
    }

    let userQuery = User.find(query)
      .select('-password')
      .populate('category', 'name')
      .populate('enrolledCourses.courseId', 'title')
      .sort({ createdAt: -1 });

    const users = await userQuery;

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST create new user
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    // Check if user already exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already exists' },
        { status: 400 }
      );
    }

    // Auto-generate roll number for students
    if ((body.role === 'student' || body.role === undefined) && !body.rollNumber) {
      const { ensureUniqueRollNumber } = await import('@/utils/rollNumber');
      body.rollNumber = await ensureUniqueRollNumber(User, body.name);
    }

    // Set register source to 'web' for manual admin creation
    if (!body.registerSource) {
      body.registerSource = 'web';
    }


    const user = await User.create(body);
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
