import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/init';

export async function POST(request) {
    try {
        await connectDB();

        const { userId, deviceId } = await request.json();

        if (!userId || !deviceId) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Find user and check if device ID matches
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found', forceLogout: true },
                { status: 404 }
            );
        }

        // MIGRATION FIX: If activeDeviceId is missing, claim this device as active
        if (!user.activeDeviceId) {
            console.log(`[Session Check] User ${userId} has no activeDeviceId, claiming device: ${deviceId}`);
            await User.findByIdAndUpdate(userId, { 
                activeDeviceId: deviceId, 
                lastActiveAt: new Date() 
            });
            return NextResponse.json({
                success: true,
                message: 'Session is valid (device claimed)'
            });
        }

        // Check if the device ID matches the active device
        if (user.activeDeviceId !== deviceId) {
            console.log(`[Session Check] Device mismatch for user ${userId}`);
            console.log(`  Expected: ${user.activeDeviceId}`);
            console.log(`  Received: ${deviceId}`);
            
            // User is logged in on another device, force logout
            return NextResponse.json({
                success: false,
                message: 'You have been logged out because you logged in on another device',
                forceLogout: true
            });
        }

        // Device ID matches - update last active time
        await User.findByIdAndUpdate(userId, {
            lastActiveAt: new Date()
        });

        return NextResponse.json({
            success: true,
            message: 'Session is valid'
        });

    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
