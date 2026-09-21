import mongoose from 'mongoose';
import User from '@/models/User';
import Notification from '@/models/Notification';

/**
 * Compute a course's access expiry date from its duration config.
 */
export function computeExpiryDate(course) {
    let expiryDate = new Date();
    if (course.duration?.value && course.duration?.unit) {
        const { value, unit } = course.duration;
        if (unit === 'days') expiryDate.setDate(expiryDate.getDate() + value);
        if (unit === 'months') expiryDate.setMonth(expiryDate.getMonth() + value);
        if (unit === 'years') expiryDate.setFullYear(expiryDate.getFullYear() + value);
    } else {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }
    return expiryDate;
}

/**
 * Replace any existing enrollment for this course with a fresh one.
 */
export async function enrollUserInCourse(userId, courseId, expiryDate) {
    await User.updateOne(
        { _id: userId },
        { $pull: { enrolledCourses: { courseId: new mongoose.Types.ObjectId(courseId) } } }
    );
    await User.updateOne(
        { _id: userId },
        { $pull: { enrolledCourses: courseId } }
    );

    const newEnrollment = {
        courseId: new mongoose.Types.ObjectId(courseId),
        enrolledAt: new Date(),
        expiresAt: expiryDate
    };

    await User.updateOne(
        { _id: userId },
        { $push: { enrolledCourses: newEnrollment } }
    );
}

/**
 * Record an in-app notification and send an FCM push for a course purchase.
 */
export async function notifyCoursePurchase(userId, updatedUser, course) {
    try {
        await Notification.create({
            title: '🎉 Course Purchased!',
            message: `Thank you for purchasing "${course.title}". Start learning now!`,
            type: 'course_purchase',
            createdBy: new mongoose.Types.ObjectId(userId),
            recipients: [{ userId: new mongoose.Types.ObjectId(userId) }],
            status: 'active',
            data: {
                courseId: course._id.toString(),
                courseName: course.title || '',
                thumbnail: course.thumbnail || ''
            }
        });
    } catch (dbError) {
        console.error('❌ DB Notification save error:', dbError.message);
    }

    try {
        if (updatedUser.fcmToken) {
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

            const message = {
                notification: {
                    title: '🎉 Course Purchased!',
                    body: `Thank you for purchasing "${course.title}". Start learning now!`,
                    imageUrl: course.thumbnail,
                },
                data: {
                    type: 'course_purchase',
                    courseId: course._id.toString(),
                    courseName: course.title,
                },
                token: updatedUser.fcmToken,
                android: {
                    priority: 'high',
                    notification: {
                        imageUrl: course.thumbnail,
                        icon: '@mipmap/launcher_icon',
                        color: '#FF0000',
                        channelId: 'high_importance_channel',
                        sound: 'default',
                    },
                },
            };
            await admin.messaging().send(message);
        }
    } catch (notifError) {
        console.error('❌ Notification error:', notifError.message || notifError);
    }
}
