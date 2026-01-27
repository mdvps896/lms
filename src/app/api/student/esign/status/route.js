import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ESignSubmission from '@/models/ESignSubmission';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
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
