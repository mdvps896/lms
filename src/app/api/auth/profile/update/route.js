import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Category from '@/models/Category';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { userId, name, phone, address, city, state, pincode, profileImage, category } = body;

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        // Validate category if provided
        if (category) {
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                return NextResponse.json(
                    { success: false, message: 'Invalid category selected' },
                    { status: 400 }
                );
            }
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
        if (category) updateData.category = category;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        )
        .select('-password')
        .populate('category', 'name')
        .lean();

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
