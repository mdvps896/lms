import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import Payment from '@/models/Payment';
import { sendAdminPurchaseNotification } from '@/lib/sendAdminPurchaseNotification';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import { getAuthenticatedUser } from '@/utils/apiAuth';
import { computeExpiryDate, enrollUserInCourse, notifyCoursePurchase } from './helpers';
import { computePayableAmount, toPaisa } from '@/utils/coursePricing';

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

            // 🔒 SECURITY: server-side validate that the coupon really grants a
            // free (100%) enrollment for this course AND this user — never
            // trust a client-sent `isFree` flag on its own. computePayableAmount
            // also enforces the per-user redemption cap.
            if (!couponCode) {
                return NextResponse.json({ success: false, message: 'A valid coupon is required for free enrollment' }, { status: 400 });
            }

            const freePricing = await computePayableAmount({
                course,
                couponCode,
                userId: targetUserId
            });

            if (freePricing.couponError) {
                return NextResponse.json({ success: false, message: freePricing.couponError }, { status: 400 });
            }
            if (freePricing.payable > 0) {
                return NextResponse.json({ success: false, message: 'Coupon does not cover the full course price' }, { status: 400 });
            }
            const coupon = freePricing.coupon;

            const expiryDate = computeExpiryDate(course);
            await enrollUserInCourse(targetUserId, courseId, expiryDate);

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

            await recordCouponRedemption(coupon, targetUserId, courseId);

            const updatedUser = await User.findById(targetUserId);
            await notifyCoursePurchase(targetUserId, updatedUser, course);

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

        // 🔒 SECURITY: Idempotency — a retried/replayed verify call for a payment
        // we've already recorded must not re-run enrollment/notifications.
        const existingPayment = await Payment.findOne({ razorpayPaymentId: razorpay_payment_id });
        if (existingPayment) {
            return NextResponse.json({ success: true, message: 'Payment already verified' });
        }

        const db = mongoose.connection.db;
        const settings = await db.collection('settings').findOne({});
        const keySecret = settings?.integrations?.razorpay?.keySecret;
        const keyId = settings?.integrations?.razorpay?.keyId;

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

        // 🔒 SECURITY: Fetch the order from Razorpay and confirm it was created for
        // THIS course/user and for the course's real price — a valid signature only
        // proves the order+payment IDs match, not that they were meant for this
        // course, so without this check a cheap order could be "verified" against
        // any course.
        const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const order = await instance.orders.fetch(razorpay_order_id);
        const orderCourseId = order?.notes?.courseId;
        const orderUserId = order?.notes?.userId;
        const effectiveCourseId = courseId || orderCourseId;
        const effectiveUserId = targetUserId || orderUserId;

        if (!effectiveUserId || !effectiveCourseId) {
            return NextResponse.json({ success: false, message: 'Unable to determine order details' }, { status: 400 });
        }

        const course = await Course.findById(effectiveCourseId);
        if (!course) {
            return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });
        }

        // Orders created with a courseId in their notes (web, or newer mobile
        // builds) are strictly cross-checked. Orders from older mobile builds that
        // don't send courseId to create-order carry no notes.courseId to check
        // against, so they fall back to the signature check alone.
        // 🔒 SECURITY: always cross-check. This used to be skipped entirely
        // when the order had no notes.courseId (older mobile builds), which is
        // exactly the case a price-manipulation attack would produce.
        // /payment/create-order now always records notes.courseId.
        // Recompute what this order SHOULD have cost, applying the coupon that
        // create-order recorded in the order notes. Comparing against the full
        // course price alone would reject every legitimate discounted payment.
        const orderCouponCode = order?.notes?.couponCode || null;
        const verifiedPricing = await computePayableAmount({
            course,
            couponCode: orderCouponCode,
            userId: effectiveUserId,
            // The coupon was already consumed for this user at create-order
            // time in the free path; here we only need the price arithmetic,
            // so a per-user rejection must not block a completed payment.
            now: new Date()
        });
        const expectedPaisa = verifiedPricing.couponError
            ? toPaisa(course.price)
            : toPaisa(verifiedPricing.payable);

        if (!orderCourseId) {
            return NextResponse.json(
                { success: false, message: 'Order is missing course details. Please update the app and retry.' },
                { status: 400 }
            );
        }
        if (orderCourseId !== effectiveCourseId.toString() || order.amount !== expectedPaisa) {
            return NextResponse.json({ success: false, message: 'Order does not match course/amount' }, { status: 400 });
        }
        if (orderUserId && orderUserId !== effectiveUserId.toString()) {
            return NextResponse.json({ success: false, message: 'Order does not belong to this user' }, { status: 403 });
        }

        const user = await User.findById(effectiveUserId);
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        const expiryDate = computeExpiryDate(course);
        await enrollUserInCourse(effectiveUserId, effectiveCourseId, expiryDate);

        await Payment.create({
            user: effectiveUserId,
            course: effectiveCourseId,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            amount: expectedPaisa / 100,
            originalPrice: course.price || 0,
            status: 'success'
        });

        if (!verifiedPricing.couponError && verifiedPricing.coupon) {
            // A coupon used on a PAID order was never recorded, so currentUses
            // stayed at 0 and neither the global nor per-user cap could bind.
            await recordCouponRedemption(verifiedPricing.coupon, effectiveUserId, effectiveCourseId);
        }

        const updatedUser = await User.findById(effectiveUserId);
        await notifyCoursePurchase(effectiveUserId, updatedUser, course);

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


/**
 * Record one redemption of `coupon` by `userId` for `courseId`.
 * Safe to call with a null coupon.
 */
async function recordCouponRedemption(coupon, userId, courseId) {
    if (!coupon?._id) return;

    const Coupon = (await import('@/models/Coupon')).default;
    await Coupon.findByIdAndUpdate(coupon._id, {
        $inc: { currentUses: 1 },
        $push: {
            usedBy: {
                user: userId,
                courseId: courseId,
                usedAt: new Date()
            }
        }
    });
}
