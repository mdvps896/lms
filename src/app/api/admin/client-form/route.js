import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ClientFormSubmission from '@/models/ClientFormSubmission';
import { requirePermission } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

// GET: Admin fetches a student's client form submission
export async function GET(request) {
    try {
        await connectDB();

        const authError = await requirePermission(request, 'manage_students');
        if (authError) return authError;

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, message: 'userId required' }, { status: 400 });
        }

        const submission = await ClientFormSubmission.findOne({ user: userId }).lean();

        if (!submission) {
            return NextResponse.json({ success: false, message: 'No form submitted yet' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: submission });
    } catch (error) {
        console.error('Error fetching client form:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
