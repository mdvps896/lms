import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SelfieCapture from '@/models/SelfieCapture';
import { requireAdmin } from '@/utils/apiAuth';
import { unlink } from 'fs/promises';
import path from 'path';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function DELETE(request, { params }) {
    try {
        await connectDB();

        // Verify authentication
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const { selfieId } = params;

        if (!selfieId) {
            return NextResponse.json(
                { success: false, message: 'Selfie ID is required' },
                { status: 400 }
            );
        }

        // Find the selfie record
        const selfie = await SelfieCapture.findById(selfieId);
        if (!selfie) {
            return NextResponse.json(
                { success: false, message: 'Selfie not found' },
                { status: 404 }
            );
        }

        // Handle Image Deletion
        if (selfie.imagePath) {
            try {
                // Check if it's a Cloudinary URL
                if (selfie.imagePath.includes('cloudinary.com') || selfie.imagePath.startsWith('http')) {
                    // Extract public_id for Cloudinary deletion
                    // Format: .../upload/v<version>/<public_id>.<ext>
                    const matches = selfie.imagePath.match(/\/upload\/(?:v\d+\/)?(.+)$/);
                    if (matches && matches[1]) {
                        // Remove extension to get public_id
                        const publicIdWithExt = matches[1];
                        const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));

                        await cloudinary.uploader.destroy(publicId);
                    }
                } else {
                    // Local File Deletion
                    let fullPath = selfie.imagePath;
                    if (!path.isAbsolute(fullPath)) {
                        fullPath = path.join(process.cwd(), 'public', fullPath);
                    }
                    await unlink(fullPath);
                }
            } catch (deleteError) {
                console.error('Error deleting file/resource:', deleteError);
                // Continue with DB deletion even if image deletion fails
            }
        }

        // Delete the database record
        await SelfieCapture.findByIdAndDelete(selfieId);

        return NextResponse.json({
            success: true,
            message: 'Selfie deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting selfie:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete selfie', error: error.message },
            { status: 500 }
        );
    }
}
