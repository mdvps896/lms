import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { userId, name, phone, address, city, state, pincode, profileImage } = body;

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        // Validate that email and rollNumber are NOT being updated here
        // These are protected fields
        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (address) updateData.address = address;
        if (city) updateData.city = city;
        if (state) updateData.state = state;
        if (pincode) updateData.pincode = pincode;
        if (profileImage) updateData.profileImage = profileImage;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        ).select('-password').lean();

        if (!updatedUser) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
