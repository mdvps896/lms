import admin from '@/lib/firebase-admin';

export const sendFCMNotification = async (token, title, body, data = {}) => {
    try {
        if (!token) return null;

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
        };

        const response = await admin.messaging().send(message);
        return response;
    } catch (error) {
        console.error('Error sending FCM notification:', error);
        // Remove invalid tokens logic could go here if needed
        return null;
    }
};
