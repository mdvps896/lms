import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
function initFirebase() {
    if (!admin.apps.length) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    // Handle replacing newline characters in private key
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
            });
            } catch (error) {
            console.error('❌ Firebase Admin initialization error:', error);
        }
    }
    return admin;
}

export async function sendPushNotification(token, title, body, data = {}) {
    const firebaseAdmin = initFirebase();

    if (!token) return { success: false, error: 'No token provided' };

    try {
        const message = {
            notification: {
                title: title,
                body: body,
            },
            data: {
                ...data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
            token: token,
            android: {
                priority: 'high',
                notification: {
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
            },
        };

        const response = await firebaseAdmin.messaging().send(message);
        return { success: true, messageId: response };
    } catch (error) {
        console.error('❌ Error sending security notification:', error);
        return { success: false, error: error.message };
    }
}
