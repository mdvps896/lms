import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import Payment from '@/models/Payment';
import Notification from '@/models/Notification';
import crypto from 'crypto';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
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

        console.log(`💳 [Verify Payment] Start - OrderID: ${razorpay_order_id}, UserID: ${userId}, CourseID: ${courseId}, isFree: ${isFree}`);

        // Handle Free Enrollment (100% discount coupon)
        if (isFree === true && amount === 0) {
            console.log('🎉 Free Enrollment - Skipping Razorpay verification');

            if (!userId || !courseId) {
                return NextResponse.json({ success: false, message: 'Missing user or course ID' }, { status: 400 });
            }

            await connectDB();

            const user = await User.findById(userId);
            const course = await Course.findById(courseId);

            if (!user || !course) {
                console.error(`❌ User or Course not found in DB. User: ${!!user}, Course: ${!!course}`);
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

            console.log(`👤 Free Enrollment - User: ${user.name}, Course: ${course.title}. Expiry: ${expiryDate}`);

            // Remove existing enrollment
            await User.updateOne(
                { _id: userId },
                { $pull: { enrolledCourses: { courseId: new mongoose.Types.ObjectId(courseId) } } }
            );
            await User.updateOne(
                { _id: userId },
                { $pull: { enrolledCourses: courseId } }
            );

            // Add new enrollment
            const newEnrollment = {
                courseId: new mongoose.Types.ObjectId(courseId),
                enrolledAt: new Date(),
                expiresAt: expiryDate
            };

            await User.updateOne(
                { _id: userId },
                { $push: { enrolledCourses: newEnrollment } }
            );

            // Create Payment Record for free enrollment
            await Payment.create({
                user: userId,
                course: courseId,
                razorpayOrderId: `FREE_${Date.now()}`,
                razorpayPaymentId: `FREE_${Date.now()}`,
                amount: 0,
                originalPrice: course.price || 0,
                couponCode: couponCode || null,
                status: 'success',
                isFree: true
            });

            // Update coupon usage if coupon was used
            if (couponCode) {
                const Coupon = (await import('@/models/Coupon')).default;
                await Coupon.findOneAndUpdate(
                    { code: couponCode.toUpperCase() },
                    {
                        $inc: { currentUses: 1 },
                        $push: {
                            usedBy: {
                                user: userId,
                                courseId: courseId,
                                usedAt: new Date()
                            }
                        }
                    }
                );
                console.log(`✅ Coupon ${couponCode} usage updated`);
            }

            const updatedUser = await User.findById(userId);
            console.log(`🎉 Free Enrollment Complete. User now has ${updatedUser.enrolledCourses?.length || 0} courses.`);
            console.log(`🔔 User FCM Token: ${updatedUser.fcmToken || 'NOT SET'}`);

            // Save Notification to DB for history
            try {
                await Notification.create({
                    title: '🎉 Course Purchased!',
                    message: `Thank you for purchasing "${course.title}". Start learning now!`,
                    type: 'course_purchase',
                    createdBy: userId, // System notification
                    recipients: [{ userId: userId }],
                    data: {
                        courseId: course._id.toString(),
                        courseName: course.title,
                        thumbnail: course.thumbnail
                    }
                });
                console.log('✅ Notification saved to DB');
            } catch (dbError) {
                console.error('❌ DB Notification save error:', dbError.message);
            }

            // Send push notification
            try {
                if (updatedUser.fcmToken) {
                    // Import Firebase Admin dynamically
                    const admin = (await import('firebase-admin')).default;

                    // Initialize if not already initialized
                    if (!admin.apps.length) {
                        admin.initializeApp({
                            credential: admin.credential.cert({
                                projectId: process.env.FIREBASE_PROJECT_ID,
                                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                            }),
                        });
                        console.log('✅ Firebase Admin initialized for notifications');
                    }

                    // Send notification directly
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
                    console.log('📬 Notification sent successfully');
                } else {
                    console.log('⚠️ User has no FCM token, skipping notification');
                }
            } catch (notifError) {
                console.error('❌ Notification error:', notifError.message);
            }

            return NextResponse.json({
                success: true,
                message: 'Enrolled successfully with coupon',
                user: updatedUser
            });
        }

        // Regular Paid Enrollment - Razorpay Verification Required
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ success: false, message: 'Missing payment details' }, { status: 400 });
        }

        await connectDB();

        // Get Settings for Secret
        const db = mongoose.connection.db;
        const settings = await db.collection('settings').findOne({});
        const keySecret = settings?.integrations?.razorpay?.keySecret;

        if (!keySecret) {
            console.error('❌ Razorpay Secret not found in settings');
            return NextResponse.json({ success: false, message: 'Payment configuration missing' }, { status: 500 });
        }

        // Signature Verification
        const generated_signature = crypto
            .createHmac('sha256', keySecret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            console.error('❌ Signature mismatch!');
            return NextResponse.json({ success: false, message: 'Invalid payment signature' }, { status: 400 });
        }

        console.log('✅ Signature Verified. Proceeding to Enrollment...');

        if (!userId || !courseId) {
            return NextResponse.json({ success: true, message: 'Payment verified, but missing IDs to enroll' });
        }

        const user = await User.findById(userId);
        const course = await Course.findById(courseId);

        if (!user || !course) {
            console.error(`❌ User or Course not found in DB. User: ${!!user}, Course: ${!!course}`);
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
            expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Default 1 year
        }

        console.log(`👤 User: ${user.name}, Course: ${course.title}. New Expiry: ${expiryDate}`);

        // Update Enrollment Atomically to be safer
        // 1. Remove any existing enrollment (both formats)
        await User.updateOne(
            { _id: userId },
            {
                $pull: {
                    enrolledCourses: { courseId: new mongoose.Types.ObjectId(courseId) }
                }
            }
        );
        await User.updateOne(
            { _id: userId },
            {
                $pull: { enrolledCourses: courseId }
            }
        );

        // 2. Add new enrollment
        const newEnrollment = {
            courseId: new mongoose.Types.ObjectId(courseId),
            enrolledAt: new Date(),
            expiresAt: expiryDate
        };

        const updateResult = await User.updateOne(
            { _id: userId },
            { $push: { enrolledCourses: newEnrollment } }
        );

        console.log(`📝 Update Result: matched=${updateResult.matchedCount}, modified=${updateResult.modifiedCount}`);

        // 3. Create Payment Record
        await Payment.create({
            user: userId,
            course: courseId,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            amount: amount,
            originalPrice: course.price || 0,
            status: 'success'
        });

        // Fetch user again to verify
        const updatedUser = await User.findById(userId);
        console.log(`🎉 Enrollment done. User now has ${updatedUser.enrolledCourses?.length || 0} courses.`);

        // Save Notification to DB for history
        try {
            await Notification.create({
                title: '🎉 Course Purchased!',
                message: `Thank you for purchasing "${course.title}". Start learning now!`,
                type: 'course_purchase',
                createdBy: userId,
                recipients: [{ userId: userId }],
                data: {
                    courseId: course._id.toString(),
                    courseName: course.title,
                    thumbnail: course.thumbnail
                }
            });
            console.log('✅ Notification saved to DB');
        } catch (dbError) {
            console.error('❌ DB Notification save error:', dbError.message);
        }

        // Send push notification
        try {
            if (updatedUser.fcmToken) {
                // Import Firebase Admin dynamically
                const admin = (await import('firebase-admin')).default;

                // Initialize if not already initialized
                if (!admin.apps.length) {
                    admin.initializeApp({
                        credential: admin.credential.cert({
                            projectId: process.env.FIREBASE_PROJECT_ID,
                            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                        }),
                    });
                }

                // Send notification directly
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
                console.log('📬 Notification sent to user');
            }
        } catch (notifError) {
            console.error('❌ Notification error:', notifError);
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
