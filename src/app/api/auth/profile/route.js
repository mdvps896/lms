import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthenticatedUser, requirePermission } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        await connectDB();
        const currentUser = await getAuthenticatedUser(request);
        const { userId } = await request.json();

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        // Users can only fetch their own profile, unless they are admin
        if (currentUser.role !== 'admin' && currentUser.id !== userId && currentUser._id?.toString() !== userId) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const user = await User.findById(userId).lean();

        if (!user) {
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

export async function GET(request) {
    // Security: Manage live exams permission required to fetch all users (for monitoring)
    const authError = await requirePermission(request, 'manage_live_exams');
    if (authError) return authError;

    try {
        await connectDB();

        // Fetch users for live monitoring
        const users = await User.find({
            role: 'student',
            status: 'active'
        }).select('name email profileImage').lean();

        return NextResponse.json({
            success: true,
            users: users
        });

    } catch (error) {
        console.error('Fetch users error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
