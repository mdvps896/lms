import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        await connectDB();
        const { userId, oldPassword, newPassword } = await request.json();

        if (!userId || !oldPassword || !newPassword) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        // Check old password
        let isPasswordValid = false;
        if (user.password.startsWith('$2')) {
            isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        } else {
            isPasswordValid = user.password === oldPassword;
        }

        if (!isPasswordValid) {
            return NextResponse.json({ success: false, message: 'Incorrect old password' }, { status: 401 });
        }

        // Reset password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(userId, { password: hashedPassword });

        return NextResponse.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
