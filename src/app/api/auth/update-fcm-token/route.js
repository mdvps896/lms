import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
    try {
        await connectDB();

        const body = await request.json();
        const { userId, fcmToken } = body;

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
