import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import User from '@/models/User';
import Course from '@/models/Course';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();

        // Ensure models are registered
        // Sometimes Next.js dev server hot reload loses model registration if not imported in route

        const payments = await Payment.find({})
            .populate('user', 'name email phone')
            .populate('course', 'title price')
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: payments });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
    }
}
