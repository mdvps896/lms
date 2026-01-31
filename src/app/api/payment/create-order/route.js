import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Razorpay from 'razorpay';
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
        const { amount, currency } = body;

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

        const amountInPaisa = Math.round(amount * 100);

        const options = {
            amount: amountInPaisa,
            currency: currency || 'INR',
            receipt: `rcpt_${Date.now()}`,
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
