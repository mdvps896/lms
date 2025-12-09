import { NextResponse } from 'next/server';
import path from 'path';
import { writeFile, unlink } from 'fs/promises';
import fs from 'fs';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';

export const POST = async (req) => {
  try {
    await dbConnect();

    const formData = await req.formData();
    const file = formData.get('profileImage');

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        message: 'No file received' 
      }, { status: 400 });
    }

    // Get user info from cookie
    const userCookie = req.cookies.get('user')?.value;
    if (!userCookie) {
      return NextResponse.json({ 
        success: false, 
        message: 'Not authenticated' 
      }, { status: 401 });
    }

    const currentUser = JSON.parse(userCookie);

    // Get existing user from database to check for old profile image
    const existingUser = await User.findById(currentUser._id);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Please upload an image file' 
      }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        success: false, 
        message: 'File size must be less than 5MB' 
      }, { status: 400 });
    }

    // Delete old profile image if it exists
    if (existingUser?.profileImage && existingUser.profileImage.startsWith('/images/profile/')) {
      const oldImagePath = path.join(process.cwd(), 'public', existingUser.profileImage);
      try {
        if (fs.existsSync(oldImagePath)) {
          await unlink(oldImagePath);
          console.log('Old profile image deleted:', oldImagePath);
        }
      } catch (unlinkError) {
        console.error('Error deleting old profile image:', unlinkError);
        // Continue even if deletion fails
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `profile_${currentUser._id}_${Date.now()}.${file.name.split('.').pop()}`;
    
    // Create profile images directory
    const uploadDir = path.join(process.cwd(), 'public/images/profile');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const imageUrl = `/images/profile/${filename}`;

    // Update user profile with new image URL
    await User.findByIdAndUpdate(
      currentUser._id,
      { profileImage: imageUrl },
      { new: true }
    );

    return NextResponse.json({ 
      success: true,
      imageUrl,
      message: 'Profile image uploaded successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Profile image upload error:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to upload profile image',
      error: error.message 
    }, { status: 500 });
  }
};