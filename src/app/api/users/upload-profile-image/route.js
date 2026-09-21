import { NextResponse } from 'next/server';
import path from 'path';
import { unlink } from 'fs/promises';
import fs from 'fs';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { saveToLocalStorage, deleteFromLocalStorage } from '@/utils/localStorage';
import { getAuthenticatedUser } from '@/utils/apiAuth';

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

    // 🔒 SECURITY: identity comes from the verified JWT. This used to
    // JSON.parse the 'user' cookie, which is written client-side and is not
    // signed — setting {"_id":"<someone else>"} in devtools was enough to
    // overwrite another account's profile image.
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        message: 'Not authenticated'
      }, { status: 401 });
    }

    const currentUserId = currentUser.id || currentUser._id?.toString();

    // Get existing user from database to check for old profile image
    const existingUser = await User.findById(currentUserId);

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

    // Get file extension from MIME type
    const extensionMap = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp'
    };
    const extension = extensionMap[mimeType] || '.jpg';
    const filename = `profile_${currentUserId}_${Date.now()}${extension}`;

    try {
      const result = await saveToLocalStorage(fileData, 'profile', filename);

      const imageUrl = result.url;

      // Update user profile with new image URL
      await User.findByIdAndUpdate(
        currentUserId,
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
