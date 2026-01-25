import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import User from '@/models/User';
import Course from '@/models/Course';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || 'all';
        const customStart = searchParams.get('startDate');
        const customEnd = searchParams.get('endDate');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        let query = {};

        if (range !== 'all') {
            let startDate = new Date();
            let endDate = new Date();

            if (range === 'custom' && customStart && customEnd) {
                startDate = new Date(customStart);
                endDate = new Date(customEnd);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
            } else if (range === '30d') {
                startDate.setDate(startDate.getDate() - 29);
                startDate.setHours(0, 0, 0, 0);
            } else if (range === 'today') {
                startDate.setHours(0, 0, 0, 0);
            } else if (range === '7d') {
                startDate.setDate(startDate.getDate() - 6);
                startDate.setHours(0, 0, 0, 0);
            }

            query.createdAt = { $gte: startDate, $lte: endDate };
        }

        const skip = (page - 1) * limit;
        const total = await Payment.countDocuments(query);

        const payments = await Payment.find(query)
            .populate('user', 'name email phone profileImage')
            .populate('course', 'title price thumbnail')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            success: true,
            data: payments,
            pagination: {
                page,
                limit,
                total,
                hasMore: skip + payments.length < total
            }
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
    }
}
