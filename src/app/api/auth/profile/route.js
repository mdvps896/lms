import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        await connectDB();
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        const user = await User.findById(userId).lean();

        if (!user) {
            console.error(`❌ Profile: User ${userId} not found`);
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user: user
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
