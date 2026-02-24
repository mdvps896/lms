import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import StudentProgress from '@/models/StudentProgress';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

// GET: Fetch student's own progress
export async function GET(request) {
    try {
        await connectDB();
        const currentUser = await getAuthenticatedUser(request);

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || currentUser.id;

        // Security: Students can only view their own progress, unless admin/teacher
        if (currentUser.role !== 'admin' && currentUser.role !== 'teacher' && currentUser.id !== userId && currentUser._id?.toString() !== userId) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        // Use findOneAndUpdate with upsert so that:
        // 1. Existing docs are returned as-is (with their otherNotes already stored)
        // 2. New docs are created with defaults
        // The $setOnInsert only runs when creating — existing docs are untouched
        let progress = await StudentProgress.findOneAndUpdate(
            { user: userId },
            { $setOnInsert: { user: userId } },
            { new: true, upsert: true }
        );

        // Convert to plain object so all schema-defined fields (incl. otherNotes) appear
        const progressObj = progress.toObject();

        // Ensure otherNotes key always exists (for clients that check containsKey)
        if (progressObj.otherNotes === undefined) {
            progressObj.otherNotes = '';
        }

        return NextResponse.json({ success: true, data: progressObj });
    } catch (error) {
        console.error('Error fetching student progress:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
