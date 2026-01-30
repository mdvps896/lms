import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        await connectDB();

        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { mobile } = body;

        if (!mobile) {
            return NextResponse.json({ success: false, message: 'Mobile number is required' }, { status: 400 });
        }

        // Check if mobile already exists for another user
        const existingUser = await User.findOne({ phone: mobile, _id: { $ne: user.id } });
        if (existingUser) {
            return NextResponse.json({ success: false, message: 'Mobile number already in use' }, { status: 400 });
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            user.id,
            { phone: mobile },
            { new: true }
        ).select('-password');

        return NextResponse.json({
            success: true,
            message: 'Mobile number updated',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update mobile error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
