import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ClientFormSubmission from '@/models/ClientFormSubmission';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export async function POST(request) {
    try {
        await connectDB();
        const currentUser = await getAuthenticatedUser(request);

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { formData } = body;

        if (!formData) {
            return NextResponse.json({ success: false, message: 'Form data required' }, { status: 400 });
        }

        // Check if already submitted
        let submission = await ClientFormSubmission.findOne({ user: currentUser.id || currentUser._id });

        if (submission) {
            submission.formData = formData;
            await submission.save();
            return NextResponse.json({
                success: true,
                message: 'Client form updated successfully',
                submissionId: submission._id
            });
        } else {
            submission = await ClientFormSubmission.create({
                user: currentUser.id || currentUser._id,
                formData
            });
            return NextResponse.json({
                success: true,
                message: 'Client form submitted successfully',
                submissionId: submission._id
            });
        }
    } catch (error) {
        console.error('Error submitting client form:', error);
        return NextResponse.json({ success: false, message: 'Failed to submit form' }, { status: 500 });
    }
}
