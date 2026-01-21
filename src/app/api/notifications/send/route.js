import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
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
        const body = await request.json();
        const {
            fcmToken,
            title,
            body: messageBody,
            imageUrl,
            courseId,
            courseName,
            type = 'course_purchase'
        } = body;

        if (!fcmToken) {
            return NextResponse.json({
                success: false,
                message: 'FCM token is required'
            }, { status: 400 });
        }

        // Prepare notification message
        const message = {
            notification: {
                title: title || '🎉 Course Purchased Successfully!',
                body: messageBody || `Congratulations! You now have access to ${courseName || 'your new course'}`,
                imageUrl: imageUrl || undefined,
            },
            data: {
                type,
                courseId: courseId || '',
                courseName: courseName || '',
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
            token: fcmToken,
            android: {
                priority: 'high',
                notification: {
                    imageUrl: imageUrl || undefined,
                    channelId: 'high_importance_channel',
                    sound: 'default',
                    priority: 'high',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
                fcm_options: {
                    image: imageUrl || undefined,
                },
            },
        };

        // Send notification
        const response = await admin.messaging().send(message);

        return NextResponse.json({
            success: true,
            message: 'Notification sent successfully',
            messageId: response,
        });

    } catch (error) {
        console.error('❌ Error sending notification:', error);
        return NextResponse.json({
            success: false,
            message: error.message,
        }, { status: 500 });
    }
}

// Send notification to topic
export async function PUT(request) {
    try {
        const body = await request.json();
        const {
            topic = 'all_users',
            title,
            body: messageBody,
            imageUrl,
            data = {}
        } = body;

        const message = {
            notification: {
                title: title || 'New Update!',
                body: messageBody || 'Check out what\'s new',
                imageUrl: imageUrl || undefined,
            },
            data: {
                ...data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
            topic,
            android: {
                priority: 'high',
                notification: {
                    imageUrl: imageUrl || undefined,
                    channelId: 'high_importance_channel',
                    sound: 'default',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                    },
                },
                fcm_options: {
                    image: imageUrl || undefined,
                },
            },
        };

        const response = await admin.messaging().send(message);

        return NextResponse.json({
            success: true,
            message: `Notification sent to topic: ${topic}`,
            messageId: response,
        });

    } catch (error) {
        console.error('❌ Error sending topic notification:', error);
        return NextResponse.json({
            success: false,
            message: error.message,
        }, { status: 500 });
    }
}
