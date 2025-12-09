import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
    try {
        await connectDB();
        
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

        // Update user's password and Google auth status (store as plain text)
        await User.updateOne(
            { email: email.toLowerCase() },
            { 
                password: password, // Store plain text password as system expects
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