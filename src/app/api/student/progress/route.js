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

        let progress = await StudentProgress.findOne({ user: userId });

        if (!progress) {
            progress = await StudentProgress.create({ user: userId });
        }

        return NextResponse.json({ success: true, data: progress });
    } catch (error) {
        console.error('Error fetching student progress:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
