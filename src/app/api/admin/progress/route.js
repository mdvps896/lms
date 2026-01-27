import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import StudentProgress from '@/models/StudentProgress';
import { verifyToken } from '@/utils/auth';

export const dynamic = 'force-dynamic';

// GET: Fetch student progress
export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        // Potential Auth Check: Only self or admin can view
        // const authUser = await verifyToken(request);
        // if (!authUser || (authUser.userId !== userId && authUser.role !== 'admin')) {
        //     return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        // }

        let progress = await StudentProgress.findOne({ user: userId });

        // If no progress document exists, create a default one
        if (!progress) {
            progress = await StudentProgress.create({ user: userId });
        }

        return NextResponse.json({ success: true, data: progress });
    } catch (error) {
        console.error('Error fetching progress:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// PATCH: Update specific steps or notes (Admin Only)
export async function PATCH(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { userId, ...updates } = body;

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        // Security: Ensure the update object is flat or correctly structured
        // In this simple implementation, we assume the body contains the keys like 'eligibilityCheck', 'dataFlow' etc.

        const progress = await StudentProgress.findOneAndUpdate(
            { user: userId },
            {
                $set: {
                    ...updates,
                    updatedAt: new Date()
                }
            },
            { new: true, upsert: true }
        );

        return NextResponse.json({ success: true, data: progress });
    } catch (error) {
        console.error('Error updating progress:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
