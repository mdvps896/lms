import { NextResponse } from 'next/server';
import { verifyToken, signToken, signRefreshToken } from '@/utils/auth';
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

        // Verify the refresh token. verifyToken now rejects expired tokens
        // outright, so an expired refresh token can no longer mint new access
        // tokens indefinitely.
        const payload = await verifyToken(refreshToken);
        if (!payload) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired refresh token' },
                { status: 401 }
            );
        }

        // 🔒 SECURITY: only a token minted by signRefreshToken may be used here,
        // so a stolen short-lived access token can't be traded up for a fresh one.
        if (payload.typ !== 'refresh') {
            return NextResponse.json(
                { success: false, message: 'Invalid refresh token' },
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

        // 🔒 SECURITY: enforce the device binding that login already records.
        // Without this, "you have been logged out on your other device" was
        // purely cosmetic — the old device's token kept working. Only enforced
        // when both sides are known, so pre-existing sessions aren't nuked.
        if (user.activeDeviceId && payload.deviceId && user.activeDeviceId !== payload.deviceId) {
            return NextResponse.json(
                { success: false, message: 'Session ended: signed in on another device' },
                { status: 401 }
            );
        }

        const claims = {
            userId: user._id.toString(),
            email: user.email,
            // Re-read role/permissions from the DB so a demotion takes effect on
            // the next refresh instead of living on in the old token's claims.
            role: user.role,
            permissions: Array.isArray(user.permissions) ? [...user.permissions] : [],
            accessScope: user.accessScope || 'own',
            deviceId: payload.deviceId
        };

        // Rotate both tokens so a refresh token that leaks has a bounded life.
        const newToken = await signToken(claims);
        const newRefreshToken = await signRefreshToken(claims);

        const response = NextResponse.json({
            success: true,
            token: newToken,
            refreshToken: newRefreshToken
        });

        response.cookies.set('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 2 * 60 * 60
        });
        response.cookies.set('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60
        });

        return response;

    } catch (error) {
        console.error('Refresh token error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to refresh token' },
            { status: 500 }
        );
    }
}
