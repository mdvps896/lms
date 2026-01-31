import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ESignSubmission from '@/models/ESignSubmission';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { userId, personalDetails, documents, selections, signature } = body;
        const currentUser = await getAuthenticatedUser(request);

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        // Security: Students can only submit their own form, unless admin
        if (currentUser.role !== 'admin' && currentUser.id !== userId && currentUser._id?.toString() !== userId) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        // Check if already submitted
        const existing = await ESignSubmission.findOne({ user: userId });
        if (existing) {
            return NextResponse.json({
                success: false,
                message: 'You have already submitted the E-Sign form. Multiple submissions are not allowed.'
            }, { status: 400 });
        }

        // Validate mandatory fields (Basic validation)
        if (!signature || !signature.clientName) {
            return NextResponse.json({ success: false, message: 'Digital Signature is required' }, { status: 400 });
        }

        // Create new submission
        const newSubmission = await ESignSubmission.create({
            user: userId,
            personalDetails,
            documents,
            selections,
            signature,
            adminStatus: 'Pending',
            pdfGenerated: false
        });

        // Sync to User model
        try {
            if (documents) {
                const User = (await import('@/models/User')).default;
                await User.findByIdAndUpdate(userId, {
                    $set: {
                        'esign_images': documents
                    }
                });
            }
        } catch (syncErr) {
            console.error('Failed to sync images to User model:', syncErr);
        }

        return NextResponse.json({
            success: true,
            message: 'E-Sign form submitted successfully',
            submissionId: newSubmission._id
        });

    } catch (error) {
        console.error('Error submitting esign form:', error);
        return NextResponse.json({ success: false, message: 'Failed to submit form' }, { status: 500 });
    }
}
