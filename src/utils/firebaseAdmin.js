import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
function initFirebase() {
    if (admin.apps.length > 0) return admin;

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        console.warn('⚠️ Firebase Admin disabled: Missing credentials in .env');
        return null;
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
        });
        } catch (error) {
        console.error('❌ Firebase Admin initialization error:', error.message);
        return null;
    }

    return admin;
}

export async function sendPushNotification(token, title, body, data = {}) {
    if (!token) return { success: false, error: 'No token provided' };

    try {
        const firebaseAdmin = initFirebase();
        if (!firebaseAdmin) {
            return { success: false, error: 'Firebase not initialized' };
        }

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
        console.error('❌ FCM Send Error:', error.message);
        return { success: false, error: error.message };
    }
}
