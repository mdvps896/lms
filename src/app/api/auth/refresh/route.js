import { NextResponse } from 'next/server';
import { verifyToken, signToken } from '@/utils/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/init';

export async function POST(request) {
    try {
        await connectDB();
        const { refreshToken } = await request.json();

        if (!refreshToken) {
            return NextResponse.json(
                { success: false, message: 'Refresh token required' },
                { status: 400 }
            );
        }

        // Verify the refresh token
        const payload = await verifyToken(refreshToken);
        if (!payload) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired refresh token' },
                { status: 401 }
            );
        }

        // Find user to ensure they still exist and check device binding if needed
        const user = await User.findById(payload.userId);
        if (!user || user.status === 'inactive' || user.status === 'suspended') {
            return NextResponse.json(
                { success: false, message: 'User not found or account disabled' },
                { status: 401 }
            );
        }

        // Optional: Check if deviceId matches (if we want strict binding)
        // if (user.activeDeviceId !== payload.deviceId) { ... }

        // Generate a new access token
        const newToken = await signToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            permissions: Array.isArray(user.permissions) ? [...user.permissions] : [],
            accessScope: user.accessScope || 'own',
            deviceId: payload.deviceId
        });

        return NextResponse.json({
            success: true,
            token: newToken
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to refresh token' },
            { status: 500 }
        );
    }
}
