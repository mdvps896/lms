import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAdmin } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        await connectDB();

        // Security check
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const body = await request.json();
        const { userId, block } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'User ID is required' },
                { status: 400 }
            );
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { isSupportBlocked: block },
            { new: true }
        );

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: block ? 'User blocked successfully' : 'User unblocked successfully',
            data: { isSupportBlocked: user.isSupportBlocked }
        });

    } catch (error) {
        console.error('Error blocking user:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update user block status' },
            { status: 500 }
        );
    }
}
