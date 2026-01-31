import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import Payment from '@/models/Payment';
import Notification from '@/models/Notification';
import { sendAdminPurchaseNotification } from '@/lib/sendAdminPurchaseNotification';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        await connectDB();
        const currentUser = await getAuthenticatedUser(request);

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            courseId,
            userId,
            amount,
            isFree,
            couponCode
        } = body;

        // Security: Students can only verify/enroll for themselves, unless admin
        const targetUserId = userId || currentUser.id || currentUser._id?.toString();
        if (currentUser.role !== 'admin' && currentUser.id !== targetUserId && currentUser._id?.toString() !== targetUserId) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        // Handle Free Enrollment (100% discount coupon)
        if (isFree === true && amount === 0) {
            if (!targetUserId || !courseId) {
                return NextResponse.json({ success: false, message: 'Missing user or course ID' }, { status: 400 });
            }

            const user = await User.findById(targetUserId);
            const course = await Course.findById(courseId);

            if (!user || !course) {
                return NextResponse.json({ success: false, message: 'User or Course not found' }, { status: 404 });
            }

            // Expiry Calculation
            let expiryDate = new Date();
            if (course.duration?.value && course.duration?.unit) {
                const { value, unit } = course.duration;
                if (unit === 'days') expiryDate.setDate(expiryDate.getDate() + value);
                if (unit === 'months') expiryDate.setMonth(expiryDate.getMonth() + value);
                if (unit === 'years') expiryDate.setFullYear(expiryDate.getFullYear() + value);
            } else {
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            }

            // Remove existing enrollment
            await User.updateOne(
                { _id: targetUserId },
                { $pull: { enrolledCourses: { courseId: new mongoose.Types.ObjectId(courseId) } } }
            );
            await User.updateOne(
                { _id: targetUserId },
                { $pull: { enrolledCourses: courseId } }
            );

            // Add new enrollment
            const newEnrollment = {
                courseId: new mongoose.Types.ObjectId(courseId),
                enrolledAt: new Date(),
                expiresAt: expiryDate
            };

            await User.updateOne(
                { _id: targetUserId },
                { $push: { enrolledCourses: newEnrollment } }
            );

            // Create Payment Record
            await Payment.create({
                user: targetUserId,
                course: courseId,
                razorpayOrderId: `FREE_${Date.now()}`,
                razorpayPaymentId: `FREE_${Date.now()}`,
                amount: 0,
                originalPrice: course.price || 0,
                couponCode: couponCode || null,
                status: 'success',
                isFree: true
            });

            if (couponCode) {
                const Coupon = (await import('@/models/Coupon')).default;
                await Coupon.findOneAndUpdate(
                    { code: couponCode.toUpperCase() },
                    {
                        $inc: { currentUses: 1 },
                        $push: {
                            usedBy: {
                                user: targetUserId,
                                courseId: courseId,
                                usedAt: new Date()
                            }
                        }
                    }
                );
            }

            const updatedUser = await User.findById(targetUserId);
            try {
                await Notification.create({
                    title: '🎉 Course Purchased!',
                    message: `Thank you for purchasing "${course.title}". Start learning now!`,
                    type: 'course_purchase',
                    createdBy: new mongoose.Types.ObjectId(targetUserId),
                    recipients: [{ userId: new mongoose.Types.ObjectId(targetUserId) }],
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

            // Send push notification
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
                console.error('❌ Notification error:', notifError.message);
            }

            try {
                await sendAdminPurchaseNotification({
                    user: { name: user.name, email: user.email },
                    course: { title: course.title, price: course.price },
                    amount: 0,
                    couponCode: couponCode,
                    isFree: true
                });
            } catch (emailError) {
                console.error('❌ Admin email notification error:', emailError.message);
            }

            return NextResponse.json({
                success: true,
                message: 'Enrolled successfully with coupon',
                user: updatedUser
            });
        }

        // Regular Paid Enrollment
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ success: false, message: 'Missing payment details' }, { status: 400 });
        }

        const db = mongoose.connection.db;
        const settings = await db.collection('settings').findOne({});
        const keySecret = settings?.integrations?.razorpay?.keySecret;

        if (!keySecret) {
            return NextResponse.json({ success: false, message: 'Payment configuration missing' }, { status: 500 });
        }

        const generated_signature = crypto
            .createHmac('sha256', keySecret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return NextResponse.json({ success: false, message: 'Invalid payment signature' }, { status: 400 });
        }

        if (!targetUserId || !courseId) {
            return NextResponse.json({ success: true, message: 'Payment verified, but missing IDs to enroll' });
        }

        const user = await User.findById(targetUserId);
        const course = await Course.findById(courseId);

        if (!user || !course) {
            return NextResponse.json({ success: false, message: 'User or Course not found' }, { status: 404 });
        }

        let expiryDate = new Date();
        if (course.duration?.value && course.duration?.unit) {
            const { value, unit } = course.duration;
            if (unit === 'days') expiryDate.setDate(expiryDate.getDate() + value);
            if (unit === 'months') expiryDate.setMonth(expiryDate.getMonth() + value);
            if (unit === 'years') expiryDate.setFullYear(expiryDate.getFullYear() + value);
        } else {
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        }

        await User.updateOne(
            { _id: targetUserId },
            { $pull: { enrolledCourses: { courseId: new mongoose.Types.ObjectId(courseId) } } }
        );
        await User.updateOne(
            { _id: targetUserId },
            { $pull: { enrolledCourses: courseId } }
        );

        const newEnrollment = {
            courseId: new mongoose.Types.ObjectId(courseId),
            enrolledAt: new Date(),
            expiresAt: expiryDate
        };

        await User.updateOne(
            { _id: targetUserId },
            { $push: { enrolledCourses: newEnrollment } }
        );

        await Payment.create({
            user: targetUserId,
            course: courseId,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            amount: amount,
            originalPrice: course.price || 0,
            status: 'success'
        });

        const updatedUser = await User.findById(targetUserId);
        try {
            await Notification.create({
                title: '🎉 Course Purchased!',
                message: `Thank you for purchasing "${course.title}". Start learning now!`,
                type: 'course_purchase',
                createdBy: new mongoose.Types.ObjectId(targetUserId),
                recipients: [{ userId: new mongoose.Types.ObjectId(targetUserId) }],
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
            console.error('❌ Notification error:', notifError);
        }

        try {
            await sendAdminPurchaseNotification({
                user: { name: user.name, email: user.email },
                course: { title: course.title, price: course.price },
                amount: amount,
                couponCode: null,
                isFree: false
            });
        } catch (emailError) {
            console.error('❌ Admin email notification error:', emailError);
        }

        return NextResponse.json({
            success: true,
            message: 'Payment verified and enrolled successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('❌ Verify Payment Exception:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
