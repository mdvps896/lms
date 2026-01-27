import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import StudentProgress from '@/models/StudentProgress';
import { verifyToken } from '@/utils/auth';

export const dynamic = 'force-dynamic';

// GET: Fetch student's own progress
export async function GET(request) {
    try {
        await connectDB();

        // Auth check
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const payload = await verifyToken(token);

        if (!payload) {
            return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || payload.userId;

        // Ensure user can only view their own progress (unless admin)
        if (payload.role !== 'admin' && payload.userId !== userId) {
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
