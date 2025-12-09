import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
    try {
        await connectDB();
        
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({
                success: false,
                error: 'Email is required'
            }, { status: 400 });
        }

        // Check if user exists with this email
        const user = await User.findOne({ email: email.toLowerCase() });

        return NextResponse.json({
            success: true,
            userExists: !!user,
            user: user ? {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                isGoogleAuth: user.isGoogleAuth
            } : null
        });

    } catch (error) {
        console.error('Check user error:', error);
        return NextResponse.json({
            success: false,
            error: 'Server error while checking user'
        }, { status: 500 });
    }
}