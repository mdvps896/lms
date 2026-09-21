
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAdmin } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
        }
        const authError = await requireAdmin(request);
        if (authError) return authError;

        await connectDB();
        const user = await User.findOne({ name: /sejal/i }).select('_id name email').lean();
        return NextResponse.json({ success: true, user });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
