import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export async function PUT(request) {
    try {
        await connectDB();

        const body = await request.json();
        const { name, phone } = body;

        // 🔒 SECURITY: Use the signed JWT (not the spoofable client-side `user`
        // cookie) to identify who is updating their profile.
        const currentUser = await getAuthenticatedUser(request);
        if (!currentUser) {
            return Response.json({
                success: false,
                message: 'Not authenticated'
            }, { status: 401 });
        }

        // Update user (only name and phone are allowed to be updated)
        const updatedUser = await User.findByIdAndUpdate(
            currentUser.id || currentUser._id,
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