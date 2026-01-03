import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        // Find active notifications where the user is a recipient
        const notifications = await Notification.find({
            status: 'active',
            'recipients.userId': userId
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        // Format for mobile
        const formatted = notifications.map(notif => {
            const recipient = notif.recipients.find(r => r.userId.toString() === userId);

            // Extract data from Map
            const data = {};
            if (notif.data) {
                for (let [key, value] of notif.data) {
                    data[key] = value;
                }
            }

            return {
                id: notif._id.toString(),
                title: notif.title,
                body: notif.message,
                type: notif.type,
                data: data,
                read: recipient ? recipient.read : false,
                createdAt: notif.createdAt
            };
        });

        const unreadCount = formatted.filter(n => !n.read).length;

        return NextResponse.json({
            success: true,
            notifications: formatted,
            unreadCount: unreadCount
        });

    } catch (error) {
        console.error('Fetch notifications error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        await connectDB();
        const { userId, notificationId, markAll } = await request.json();

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        if (markAll) {
            // Mark all as read for this user
            await Notification.updateMany(
                { 'recipients.userId': userId },
                { $set: { 'recipients.$.read': true, 'recipients.$.readAt': new Date() } }
            );
        } else if (notificationId) {
            // Mark specific as read
            await Notification.updateOne(
                { _id: notificationId, 'recipients.userId': userId },
                { $set: { 'recipients.$.read': true, 'recipients.$.readAt': new Date() } }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Update notification error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}