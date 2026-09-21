import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export async function POST(request) {
    try {
        await connectDB();

        const body = await request.json();
        // 🔒 SECURITY: act on the caller's own account, taken from the verified
        // JWT. This used to trust a `userId` sent in the request body, so any
        // authenticated user could target somebody else's account (e.g. switch
        // another user's 2FA off, or repoint their push notifications).
        const currentUser = await getAuthenticatedUser(request);
        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const userId = currentUser.id || currentUser._id?.toString();
        const { fcmToken } = body;

        if (!userId || !fcmToken) {
            return NextResponse.json({
                success: false,
                message: 'User ID and FCM token are required'
            }, { status: 400 });
        }

        // Update user's FCM token
        const user = await User.findByIdAndUpdate(
            userId,
            { fcmToken },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'FCM token updated successfully',
        });

    } catch (error) {
        console.error('❌ Update FCM Token Error:', error);
        return NextResponse.json({
            success: false,
            message: error.message,
        }, { status: 500 });
    }
}
