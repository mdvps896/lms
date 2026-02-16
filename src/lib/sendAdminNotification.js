
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

/**
 * Send push notification to all admins when a new user registers
 * @param {Object} newUser - The newly registered user object
 */
export async function sendAdminNewUserRegistryNotification(newUser) {
    try {
        await connectDB();

        // 1. Find ALL admins (for DB record and Push)
        // separate query to ensure we get IDs for everyone, and tokens for those who have them
        const allAdmins = await User.find({ role: 'admin' }).select('fcmToken _id email');

        if (!allAdmins || allAdmins.length === 0) {
            console.log('No admins found in system.');
            return;
        }

        const validAdminsWithTokens = allAdmins.filter(a => a.fcmToken && a.fcmToken.trim() !== '');

        // 2. Initialize Firebase Admin if not already
        const admin = (await import('firebase-admin')).default;
        // ... (init logic remains same, assuming it's correct in context) ...
        if (!admin.apps.length) {
            try {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                    }),
                });
            } catch (initError) {
                console.error('Firebase admin init error:', initError);
                return;
            }
        }

        // 3. Create Notification in Database
        try {
            const Notification = (await import('@/models/Notification')).default;
            const newNotif = await Notification.create({
                title: '👤 New User Registered',
                message: `${newUser.name} has joined via ${newUser.registerSource || 'App'}.`,
                type: 'new_user_registration',
                targetRole: 'admin',
                data: {
                    userId: newUser._id.toString(),
                    name: newUser.name,
                    email: newUser.email,
                    source: newUser.registerSource || 'app',
                    authMethod: newUser.authProvider || 'local'
                },
                createdBy: newUser._id,
                recipients: allAdmins.map(a => ({ userId: a._id, read: false }))
            });
            console.log('✅ Admin Notification saved to DB:', newNotif._id);
        } catch (dbError) {
            console.error('❌ Failed to save notification to DB:', dbError);
            if (dbError.name === 'ValidationError') {
                try {
                    // Try fallback to 'general' type if 'new_user_registration' enum failed
                    console.log('⚠️ Falling back to general notification type...');
                    const Notification = (await import('@/models/Notification')).default;
                    await Notification.create({
                        title: '👤 New User Registered',
                        message: `${newUser.name} has joined via ${newUser.registerSource || 'App'}.`,
                        type: 'general',
                        targetRole: 'admin',
                        data: {
                            userId: newUser._id.toString(),
                            name: newUser.name,
                            email: newUser.email,
                            source: newUser.registerSource || 'app',
                            authMethod: newUser.authProvider || 'local'
                        },
                        createdBy: newUser._id,
                        recipients: allAdmins.map(a => ({ userId: a._id, read: false }))
                    });
                    console.log('✅ Fallback Notification saved.');
                } catch (fallbackError) {
                    console.error('❌ Fallback failed too:', fallbackError);
                }
            }
        }

        // 4. Prepare Tokens
        const tokens = validAdminsWithTokens.map(a => a.fcmToken);

        if (tokens.length > 0) {
            // 5. Provide Payload & Send
            const message = {
                notification: {
                    title: '👤 New User Registered!',
                    body: `${newUser.name} has joined via ${newUser.registerSource || 'App'}.`,
                },
                data: {
                    type: 'new_user_registration',
                    userId: newUser._id.toString(),
                    click_action: 'FLUTTER_NOTIFICATION_CLICK',
                },
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        channelId: 'high_importance_channel',
                        icon: '@mipmap/launcher_icon',
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                        },
                    },
                },
                tokens: tokens, // Multicast
            };

            // 5. Send to all admins
            const response = await admin.messaging().sendEachForMulticast(message);

            console.log(`Sent new user notification to ${response.successCount} admins. (${response.failureCount} failed)`);
        } else {
            console.log('No valid FCM tokens found to send push notification.');
        }

    } catch (error) {
        console.error('❌ Error sending admin registration notification:', error);
    }
}
