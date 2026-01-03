import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        const payments = await Payment.find({ user: userId })
            .populate('course', 'title thumbnail')
            .sort({ createdAt: -1 })
            .lean();

        const formatted = payments.map(p => {
            console.log(`💰 Processing payment ${p._id}: orderId=${p.razorpayOrderId}, order_id=${p.razorpay_order_id}`);
            return {
                id: p._id.toString(),
                courseTitle: p.course?.title || 'Unknown Course',
                courseThumbnail: p.course?.thumbnail || '',
                amount: p.amount,
                status: p.status,
                date: p.createdAt,
                razorpayPaymentId: p.razorpayPaymentId || p.razorpay_payment_id,
                razorpayOrderId: p.razorpayOrderId || p.razorpay_order_id,
                isFree: p.isFree || false
            };
        });

        return NextResponse.json({
            success: true,
            data: formatted
        });

    } catch (error) {
        console.error('Fetch payments error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
