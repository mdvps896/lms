import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import StudentProgress from '@/models/StudentProgress';

export const dynamic = 'force-dynamic';

// POST: Add a new bill (Admin Upload)
export async function POST(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        const body = await request.json();
        const { name, url } = body;

        if (!name || !url) {
            return NextResponse.json({ success: false, message: 'Bill name and URL are required' }, { status: 400 });
        }

        const progress = await StudentProgress.findOneAndUpdate(
            { user: userId },
            {
                $push: { bills: { name, url, status: 'Uploaded', uploadedAt: new Date() } }
            },
            { new: true, upsert: true }
        );

        return NextResponse.json({ success: true, data: progress });
    } catch (error) {
        console.error('Error adding bill:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// PATCH: Mark bill as downloaded (Student Action)
export async function PATCH(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { userId, billId } = body;

        if (!userId || !billId) {
            return NextResponse.json({ success: false, message: 'User ID and Bill ID required' }, { status: 400 });
        }

        const progress = await StudentProgress.findOneAndUpdate(
            { user: userId, 'bills._id': billId },
            {
                $set: {
                    'bills.$.status': 'Downloaded',
                    'bills.$.downloadedAt': new Date()
                }
            },
            { new: true }
        );

        if (!progress) {
            return NextResponse.json({ success: false, message: 'Progress or Bill not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: progress });
    } catch (error) {
        console.error('Error marking bill downloaded:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
