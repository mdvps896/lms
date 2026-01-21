import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
        } catch (error) {
        console.error('❌ Firebase Admin initialization error:', error);
    }
}

export async function POST(request) {
    try {
        await connectDB();

        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'User ID is required'
            }, { status: 400 });
        }

        // Get user's FCM token
        const user = await User.findById(userId).select('fcmToken name');

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        if (!user.fcmToken) {
            return NextResponse.json({
                success: false,
                message: 'User has no FCM token. Please restart the app to get notification permission.'
            }, { status: 400 });
        }

        // Send test notification
        const message = {
            notification: {
                title: '🔔 Test Notification',
                body: `Hello ${user.name}! Your notifications are working perfectly! 🎉`,
            },
            data: {
                type: 'test',
                timestamp: new Date().toISOString(),
            },
            token: user.fcmToken,
        };

        const response = await admin.messaging().send(message);
        return NextResponse.json({
            success: true,
            message: 'Test notification sent successfully!',
            messageId: response,
        });

    } catch (error) {
        console.error('❌ Test Notification Error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to send test notification',
        }, { status: 500 });
    }
}
