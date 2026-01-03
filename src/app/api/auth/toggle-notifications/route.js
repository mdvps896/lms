import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
    try {
        await connectDB();
        const { userId, enabled } = await request.json();

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { notificationsEnabled: enabled === true } },
            { new: true }
        ).select('-password');

        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: `Notifications ${enabled ? 'enabled' : 'disabled'} successfully`,
            notificationsEnabled: user.notificationsEnabled
        });

    } catch (error) {
        console.error('Toggle notifications error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
