import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ESignSubmission from '@/models/ESignSubmission';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const currentUser = await getAuthenticatedUser(request);

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        // Security: Students can only check their own status, unless admin
        if (currentUser.role !== 'admin' && currentUser.id !== userId && currentUser._id?.toString() !== userId) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const submission = await ESignSubmission.findOne({ user: userId }).select('createdAt adminStatus pdfGenerated');

        if (submission) {
            return NextResponse.json({
                success: true,
                submitted: true,
                submissionDate: submission.createdAt,
                status: submission.adminStatus,
                pdfGenerated: submission.pdfGenerated
            });
        }

        return NextResponse.json({
            success: true,
            submitted: false
        });

    } catch (error) {
        console.error('Error checking esign status:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
