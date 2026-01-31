import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SelfieCapture from '@/models/SelfieCapture';
import { requireAdmin } from '@/utils/apiAuth';
import { unlink } from 'fs/promises';
import path from 'path';

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

        // Delete the file from filesystem if it exists
        if (selfie.imagePath) {
            try {
                // If it's a relative path starting with /, make it absolute relative to public
                let fullPath = selfie.imagePath;
                if (!path.isAbsolute(fullPath)) {
                    fullPath = path.join(process.cwd(), 'public', fullPath);
                }
                await unlink(fullPath);
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
                // Continue with DB deletion even if file deletion fails
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
