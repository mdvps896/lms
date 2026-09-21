import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/utils/apiAuth';

export async function POST(request) {
    try {
        await connectDB();

        const currentUser = await getAuthenticatedUser(request);
        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { email, password, isGoogleAuth } = await request.json();

        if (!email || !password) {
            return NextResponse.json({
                success: false,
                error: 'Email and password are required'
            }, { status: 400 });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        // 🔒 SECURITY: Only the account owner (or an admin) may set this password
        const requesterId = currentUser.id || currentUser._id?.toString();
        if (currentUser.role !== 'admin' && user._id.toString() !== requesterId) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user's password and Google auth status
        await User.updateOne(
            { email: email.toLowerCase() },
            {
                password: hashedPassword,
                isGoogleAuth: isGoogleAuth === true,
                emailVerified: true // Mark email as verified for Google users
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Update Google password error:', error);
        return NextResponse.json({
            success: false,
            error: 'Server error while updating password'
        }, { status: 500 });
    }
}