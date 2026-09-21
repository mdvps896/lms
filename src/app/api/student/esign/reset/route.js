import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ESignSubmission from '@/models/ESignSubmission';
import { requireAdmin } from '@/utils/apiAuth';

export async function POST(request) {
    try {
        await connectDB();
        const authError = await requireAdmin(request);
        if (authError) return authError;

        // Accept either `studentId` (app submissions) or `submissionId`
        // (public web submissions, which have no linked User).
        const { studentId, submissionId } = await request.json();

        if (!studentId && !submissionId) {
            return NextResponse.json({ success: false, message: 'Student ID or Submission ID required' }, { status: 400 });
        }

        const result = submissionId
            ? await ESignSubmission.deleteOne({ _id: submissionId })
            : await ESignSubmission.deleteOne({ user: studentId });

        if (result.deletedCount === 0) {
            return NextResponse.json({ success: false, message: 'No E-Sign submission found for this student' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'E-Sign Reset Successfully. student can now fill the form again.' });
    } catch (error) {
        console.error('Error resetting esign:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
