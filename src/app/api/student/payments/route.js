import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const currentUser = await getAuthenticatedUser(request);

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        // Security: Students can only access their own payments, unless admin
        if (currentUser.role !== 'admin' && currentUser.id !== userId && currentUser._id?.toString() !== userId) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const payments = await Payment.find({ user: userId })
            .populate('course', 'title thumbnail')
            .sort({ createdAt: -1 })
            .lean();

        const formatted = payments.map(p => {
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
