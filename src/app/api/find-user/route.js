
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await connectDB();
        const user = await User.findOne({ name: /sejal/i }).select('_id name email').lean();
        return NextResponse.json({ success: true, user });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
