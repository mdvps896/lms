import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ClientFormSubmission from '@/models/ClientFormSubmission';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();
        const currentUser = await getAuthenticatedUser(request);

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const submission = await ClientFormSubmission.findOne({ user: currentUser.id || currentUser._id });

        if (submission) {
            return NextResponse.json({
                success: true,
                submitted: true,
                data: submission.formData,
                updatedAt: submission.updatedAt
            });
        }

        return NextResponse.json({
            success: true,
            submitted: false
        });
    } catch (error) {
        console.error('Error fetching client form status:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
