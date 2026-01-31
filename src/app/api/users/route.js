import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Category from '@/models/Category';
import { requirePermission, getAuthenticatedUser } from '@/utils/apiAuth';

async function checkUserManagementPermission(request, targetUser) {
  const currentUser = await getAuthenticatedUser(request);
  if (!currentUser) return false;

  // Admin can manage anyone
  if (currentUser.role === 'admin') return true;

  // Teachers with manage_students can only manage students
  if (currentUser.role === 'teacher' &&
    currentUser.permissions &&
    currentUser.permissions.includes('manage_students')) {
    return targetUser.role === 'student';
  }

  return false;
}

// GET all users
export async function GET(request) {
  const authError = await requirePermission(request, 'manage_students');
  if (authError) return authError;

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
  const authError = await requirePermission(request, 'manage_students');
  if (authError) return authError;

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

    // For POST, we check permission against the *intended* role of the new user
    // If the user being created is a student, and the current user has manage_students, it's allowed.
    // If the user being created is not a student, only admin can create it.
    const intendedNewUser = { role: body.role || 'student' }; // Default to student if role not provided
    const hasPermission = await checkUserManagementPermission(request, intendedNewUser);
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions to create this user type' },
        { status: 403 }
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
