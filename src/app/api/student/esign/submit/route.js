import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ESignSubmission from '@/models/ESignSubmission';

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { userId, personalDetails, documents, selections, signature } = body;

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        // Check if already submitted
        const existing = await ESignSubmission.findOne({ user: userId });
        if (existing) {
            console.log('Submission already exists for:', userId);
            // Optional: Allow update if status is Pending? For now, keep strict as per requirement or allow overwrite for testing?
            // User likely wants to re-submit if previous failed. Let's block for now but log it.
            return NextResponse.json({
                success: false,
                message: 'You have already submitted the E-Sign form. Multiple submissions are not allowed.'
            }, { status: 400 });
        }

        console.log('Creating new submission for:', userId);

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
            pdfGenerated: false // Will be generated on demand or by a background process
        });

        // --- SYNC TO USER MODEL (Fallback Support) ---
        // Save these documents to the User model so PDF generation can find them 
        // even if looked up via User fallback.
        try {
            if (documents) {
                const userUpdate = await import('@/models/User').then(mod => mod.default.findByIdAndUpdate(userId, {
                    $set: {
                        'esign_images': documents
                    }
                }, { new: true }));
                console.log('User esign_images updated:', userUpdate ? 'Success' : 'User not found');
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
