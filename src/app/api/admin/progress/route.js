import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import StudentProgress from '@/models/StudentProgress';
import { getAuthenticatedUser, requirePermission } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

// GET: Fetch student progress
export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const currentUser = await getAuthenticatedUser(request);

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        // Security: Students can only view their own progress, unless admin/teacher
        if (currentUser.role !== 'admin' && currentUser.role !== 'teacher' && currentUser.id !== userId && currentUser._id?.toString() !== userId) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

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

        // Use requirePermission for standard admin/teacher management check
        const authError = await requirePermission(request, 'manage_students');
        if (authError) return authError;

        const body = await request.json();
        const { userId, ...updates } = body;

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

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
