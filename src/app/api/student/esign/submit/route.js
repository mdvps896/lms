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
            pdfGenerated: false // Will be generated on demand or by a background process
        });

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
