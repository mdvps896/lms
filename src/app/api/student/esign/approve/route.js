import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ESignSubmission from '@/models/ESignSubmission';
import { requireAdmin } from '@/utils/apiAuth';

export async function POST(request) {
    try {
        await connectDB();
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const { studentId } = await request.json();

        if (!studentId) {
            return NextResponse.json({ success: false, message: 'Student ID required' }, { status: 400 });
        }

        const submission = await ESignSubmission.findOne({ user: studentId });
        if (!submission) {
            return NextResponse.json({ success: false, message: 'Submission not found' }, { status: 404 });
        }

        submission.adminStatus = 'Approved';
        await submission.save();

        return NextResponse.json({ success: true, message: 'E-Sign Approved Successfully' });
    } catch (error) {
        console.error('Error approving esign:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
