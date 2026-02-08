import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ESignSubmission from '@/models/ESignSubmission';
import { requireAdmin } from '@/utils/apiAuth';

export async function POST(request) {
    try {
        await connectDB();
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const { studentId, reason } = await request.json();

        if (!studentId) {
            return NextResponse.json({ success: false, message: 'Student ID required' }, { status: 400 });
        }

        const submission = await ESignSubmission.findOne({ user: studentId });
        if (!submission) {
            return NextResponse.json({ success: false, message: 'Submission not found' }, { status: 404 });
        }

        submission.adminStatus = 'Rejected';
        // We could store the reason too if we add it to the model, but for now just status
        await submission.save();

        return NextResponse.json({ success: true, message: 'E-Sign Rejected Successfully. Student can now see the status.' });
    } catch (error) {
        console.error('Error rejecting esign:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
