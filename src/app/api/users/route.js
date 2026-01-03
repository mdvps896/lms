import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// GET all users
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const category = searchParams.get('category');
    const populate = searchParams.get('populate');

    let query = {};
    if (role) {
      query.role = role;
    }
    if (category) {
      query.category = category;
    }

    let userQuery = User.find(query)
      .select('-password')
      .populate('category', 'name')
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
      const lastStudent = await User.findOne({
        role: 'student',
        rollNumber: { $regex: /^ST-/ }
      }).sort({ createdAt: -1 });

      let nextNum = 1001;
      if (lastStudent && lastStudent.rollNumber) {
        const lastNumStr = lastStudent.rollNumber.replace('ST-', '');
        const lastNum = parseInt(lastNumStr);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }
      body.rollNumber = `ST-${nextNum}`;
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
