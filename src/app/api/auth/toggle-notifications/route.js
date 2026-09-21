import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export async function POST(request) {
    try {
        await connectDB();
        // 🔒 SECURITY: act on the caller's own account, taken from the verified
        // JWT. This used to trust a `userId` sent in the request body, so any
        // authenticated user could target somebody else's account (e.g. switch
        // another user's 2FA off, or repoint their push notifications).
        const currentUser = await getAuthenticatedUser(request);
        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const userId = currentUser.id || currentUser._id?.toString();
        const { enabled } = await request.json();

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
