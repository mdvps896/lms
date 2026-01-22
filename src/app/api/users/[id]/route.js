import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Category from '@/models/Category';

// GET single user
export async function GET(request, { params }) {
  try {
    await connectDB();
    const user = await User.findById(params.id)
      .select('-password -twoFactorSecret')
      .populate('category', 'name')
      .lean();
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PUT update user
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const body = await request.json();
    
    // Validate category if provided
    if (body.category) {
      const categoryExists = await Category.findById(body.category);
      if (!categoryExists) {
        return NextResponse.json(
          { success: false, message: 'Invalid category selected' },
          { status: 400 }
        );
      }
    }
    
    const user = await User.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    )
    .select('-password -twoFactorSecret')
    .populate('category', 'name')
    .lean();
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PATCH update user (partial update)
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const body = await request.json();
    
    // Validate category if provided
    if (body.category) {
      const categoryExists = await Category.findById(body.category);
      if (!categoryExists) {
        return NextResponse.json(
          { success: false, error: 'Invalid category selected' },
          { status: 400 }
        );
      }
    }
    
    const user = await User.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    )
    .select('-password -twoFactorSecret')
    .populate('category', 'name')
    .lean();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE user (Soft delete by default, permanent if ?permanent=true)
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    let user;

    if (permanent) {
      user = await User.findByIdAndDelete(params.id);
    } else {
      user = await User.findByIdAndUpdate(
        params.id,
        { 
          isDeleted: true,
          deletedAt: new Date()
        },
        { new: true }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: permanent ? 'User permanently deleted' : 'User moved to recycle bin' 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
