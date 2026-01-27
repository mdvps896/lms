import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Category from '@/models/Category';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        console.log('📝 Profile Update Request Body:', body);
        const { userId, name, phone, address, city, state, pincode, profileImage, category } = body;

        if (!userId) {
            console.warn('⚠️ Profile Update failed: Missing User ID');
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

        // Validate that rollNumber is NOT being updated here
        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (address) updateData.address = address;
        if (city) updateData.city = city;
        if (state) updateData.state = state;
        if (pincode) updateData.pincode = pincode;
        if (profileImage) updateData.profileImage = profileImage;
        if (category) updateData.category = category;

        // Allow email update ONLY IF current email is a dummy mobile.local email
        if (body.email) {
            const currentUser = await User.findById(userId);
            if (currentUser && currentUser.email.endsWith('@mobile.local')) {
                // Check if new email is already taken
                const emailExists = await User.findOne({
                    email: body.email.toLowerCase(),
                    _id: { $ne: userId }
                });

                if (emailExists) {
                    return NextResponse.json(
                        { success: false, message: 'Email is already registered by another user' },
                        { status: 400 }
                    );
                }

                updateData.email = body.email.toLowerCase();
            }
        }

        console.log('🔄 Updating User:', userId, 'with data:', updateData);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        )
            .select('-password')
            .populate('category', 'name')
            .lean();

        if (!updatedUser) {
            console.warn('❌ User not found for update:', userId);
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        console.log('✅ User updated successfully:', updatedUser.name);

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
