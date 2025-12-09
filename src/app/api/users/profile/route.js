import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { NextRequest } from 'next/server';

export async function PUT(request) {
    try {
        await connectDB();

        const body = await request.json();
        const { name, phone } = body;

        // Get user info from cookie/session (you'll need to implement authentication)
        const userCookie = request.cookies.get('user')?.value;
        if (!userCookie) {
            return Response.json({ 
                success: false, 
                message: 'Not authenticated' 
            }, { status: 401 });
        }

        const currentUser = JSON.parse(userCookie);
        
        // Update user (only name and phone are allowed to be updated)
        const updatedUser = await User.findByIdAndUpdate(
            currentUser._id,
            {
                name,
                phone
            },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return Response.json({ 
                success: false, 
                message: 'User not found' 
            }, { status: 404 });
        }

        return Response.json({ 
            success: true, 
            message: 'Profile updated successfully',
            data: updatedUser
        });

    } catch (error) {
        console.error('Profile update error:', error);
        return Response.json({ 
            success: false, 
            message: 'Internal server error' 
        }, { status: 500 });
    }
}