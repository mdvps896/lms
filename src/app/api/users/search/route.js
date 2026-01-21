import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { requireAdmin } from '@/utils/apiAuth';

export async function GET(req) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('query');

        if (!query || query.length < 2) {
            return NextResponse.json({ success: true, users: [] });
        }

        const users = await User.find({
            role: 'student',
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        })
            .select('_id name email profileImage isSupportBlocked')
            .limit(10)
            .lean();

        return NextResponse.json({ success: true, users });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
