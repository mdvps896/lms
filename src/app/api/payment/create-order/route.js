import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Razorpay from 'razorpay';
import Course from '@/models/Course';
import { computePayableAmount, toPaisa } from '@/utils/coursePricing';
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
        const { currency, courseId, couponCode, amount: clientAmount } = body;

        // 🔒 SECURITY: When courseId is supplied (web flow), compute the payable
        // amount from the course price server-side — never trust a client-supplied
        // amount, otherwise anyone could create an order for ₹1 and later "verify"
        // it against a full-price course. Older mobile app builds only send a raw
        // `amount`; that legacy path is kept for compatibility but is not
        // cross-checked against a course, so it depends on verify-payment's
        // signature check alone.
        // 🔒 SECURITY: the payable amount is always derived server-side from
        // the course price and a server-validated coupon (see
        // src/utils/coursePricing.js). `courseId` is now required: the old
        // fallback trusted a client-supplied `amount`, and verify-payment
        // skipped its cross-check for orders with no notes.courseId — so a ₹1
        // order could be created here and later "verified" against a
        // full-price course.
        if (!courseId) {
            return NextResponse.json(
                { success: false, message: 'Please update the app to complete this purchase.' },
                { status: 400 }
            );
        }

        const course = await Course.findById(courseId).select('price');
        if (!course) {
            return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });
        }

        const requesterIdForPricing = currentUser.id || currentUser._id?.toString();
        const pricing = await computePayableAmount({
            course,
            couponCode,
            userId: requesterIdForPricing
        });

        if (couponCode && pricing.couponError) {
            return NextResponse.json(
                { success: false, message: pricing.couponError },
                { status: 400 }
            );
        }

        const payableAmount = pricing.payable;

        const db = require('mongoose').connection.db;
        const settings = await db.collection('settings').findOne({});

        if (!settings?.integrations?.razorpay?.enabled) {
            return NextResponse.json({ success: false, message: 'Razorpay is disabled in settings' }, { status: 400 });
        }

        const { keyId, keySecret } = settings.integrations.razorpay;

        if (!keyId || !keySecret) {
            return NextResponse.json({ success: false, message: 'Razorpay credentials missing in admin settings' }, { status: 500 });
        }

        const instance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        const amountInPaisa = toPaisa(payableAmount);

        const requesterId = currentUser.id || currentUser._id?.toString();
        const options = {
            amount: amountInPaisa,
            currency: currency || 'INR',
            receipt: `rcpt_${Date.now()}`,
            notes: {
                courseId: courseId.toString(),
                userId: requesterId,
                // Recorded so verify-payment can recompute the exact same
                // expected amount instead of assuming full price.
                couponCode: couponCode ? String(couponCode).toUpperCase() : '',
            },
        };

        const order = await instance.orders.create(options);

        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: keyId
        });

    } catch (error) {
        console.error('Order creation error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Error creating order' }, { status: 500 });
    }
}
