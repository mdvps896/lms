import { NextResponse } from 'next/server';
import path from 'path';
import { unlink } from 'fs/promises';
import fs from 'fs';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { saveToLocalStorage, deleteFromLocalStorage } from '@/utils/localStorage';

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

    // Cleanup old profile image
    if (existingUser?.profileImage) {
      try {
        await deleteFromLocalStorage(existingUser.profileImage);
        console.log('Old profile image deleted:', existingUser.profileImage);
      } catch (cleanupError) {
        console.error('Error cleaning up old profile image:', cleanupError);
        // Continue even if cleanup fails
      }
    }

    // Prepare for Local upload
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';
    const fileData = `data:${mimeType};base64,${base64}`;

    const filename = `profile_${currentUser._id}_${Date.now()}`; // specific name for profile

    try {
      const result = await saveToLocalStorage(fileData, 'profile', filename);

      const imageUrl = result.url;

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

    } catch (uploadError) {
      console.error('Local profile upload error:', uploadError);
      return NextResponse.json({
        success: false,
        message: 'Failed to upload profile image to Local Storage',
        error: uploadError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Profile image upload error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to upload profile image',
      error: error.message
    }, { status: 500 });
  }
};
