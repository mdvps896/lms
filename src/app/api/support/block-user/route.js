import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { requireAdmin } from '@/utils/apiAuth';

export async function POST(req) {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    try {
        await dbConnect();
        const { userId, blocked } = await req.json();

        if (!userId) {
            return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { isSupportBlocked: blocked },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: `User ${blocked ? 'blocked' : 'unblocked'} successfully`,
            isSupportBlocked: user.isSupportBlocked
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
