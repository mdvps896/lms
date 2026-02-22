import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Notification from '@/models/Notification';

/**
 * Send push notification to all students when a new blog is published
 * @param {Object} blog - The published blog object { _id, title, image, content }
 * @param {String} adminId - The admin user ID who published the blog
 */
export async function sendBlogPublishNotification(blog, adminId) {
    try {
        await connectDB();

        // 1. Find all active students with FCM tokens for push notifications
        const allStudents = await User.find({
            role: 'student',
            isDeleted: { $ne: true }
        }).select('fcmToken _id');

        if (!allStudents || allStudents.length === 0) {
            console.log('No students found to notify about blog.');
            return;
        }

        const studentsWithTokens = allStudents.filter(s => s.fcmToken && s.fcmToken.trim() !== '');

        // 2. Create Notification in Database for all students
        try {
            const blogTitle = blog.title || 'New Blog Post';
            const blogImage = blog.image || '';
            const shortContent = blog.content
                ? blog.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...'
                : 'Check out our latest blog post!';

            await Notification.create({
                title: '📝 New Blog Published',
                message: blogTitle,
                type: 'new_blog',
                targetRole: 'student',
                data: {
                    blogId: blog._id.toString(),
                    title: blogTitle,
                    image: blogImage,
                    preview: shortContent,
                },
                createdBy: adminId,
                recipients: allStudents.map(s => ({ userId: s._id, read: false }))
            });
            console.log('✅ Blog notification saved to DB for', allStudents.length, 'students');
        } catch (dbError) {
            console.error('❌ Failed to save blog notification to DB:', dbError);
        }

        // 3. Send Push Notifications via Firebase
        const tokens = studentsWithTokens.map(s => s.fcmToken);

        if (tokens.length > 0) {
            try {
                const admin = (await import('firebase-admin')).default;

                if (!admin.apps.length) {
                    admin.initializeApp({
                        credential: admin.credential.cert({
                            projectId: process.env.FIREBASE_PROJECT_ID,
                            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                        }),
                    });
                }

                const blogTitle = blog.title || 'New Blog Post';
                const blogImage = blog.image || '';

                const message = {
                    notification: {
                        title: '📝 New Blog Published!',
                        body: blogTitle,
                        ...(blogImage ? { imageUrl: blogImage } : {}),
                    },
                    data: {
                        type: 'new_blog',
                        blogId: blog._id.toString(),
                        title: blogTitle,
                        image: blogImage,
                        click_action: 'FLUTTER_NOTIFICATION_CLICK',
                    },
                    android: {
                        priority: 'high',
                        notification: {
                            sound: 'default',
                            channelId: 'high_importance_channel',
                            icon: '@mipmap/launcher_icon',
                            ...(blogImage ? { imageUrl: blogImage } : {}),
                        },
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: 'default',
                                'mutable-content': 1,
                            },
                        },
                        ...(blogImage ? {
                            fcmOptions: {
                                imageUrl: blogImage,
                            }
                        } : {}),
                    },
                    tokens: tokens,
                };

                const response = await admin.messaging().sendEachForMulticast(message);
                console.log(`📝 Blog notification sent to ${response.successCount} students. (${response.failureCount} failed)`);
            } catch (pushError) {
                console.error('❌ Error sending blog push notification:', pushError);
            }
        } else {
            console.log('No valid FCM tokens found for blog notification.');
        }

    } catch (error) {
        console.error('❌ Error sending blog publish notification:', error);
    }
}
