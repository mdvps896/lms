
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/utils/apiAuth';
import Notification from '@/models/Notification';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        await connectDB();

        // Fetch notifications:
        // 1. Where targetRole is 'admin'
        // 2. Sort by newest first
        // DEBUG: Check total counts
        const totalCount = await Notification.countDocuments({});
        console.log('📊 Total Notifications in DB:', totalCount);

        const query = {
            $or: [
                { targetRole: 'admin' },
                { type: 'new_user_registration' },
                // Also catch 'general' notifications meant for admins (from fallback)
                { type: 'general', targetRole: 'admin' },
                { title: '👤 New User Registered' } // Fallback catch if targetRole was dropped
            ]
        };
        console.log('Querying with:', JSON.stringify(query));
        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        console.log(`🔎 Found ${notifications.length} matching admin notifications.`);

        return NextResponse.json({
            success: true,
            data: notifications
        });

    } catch (error) {
        console.error('Error fetching admin notifications:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

export async function DELETE(request) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Notification ID required' }, { status: 400 });
        }

        await connectDB();
        await Notification.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: 'Notification deleted'
        });

    } catch (error) {
        console.error('Error deleting notification:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete notification' }, { status: 500 });
    }
}
