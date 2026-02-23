import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';
import Settings from '@/models/Settings';
import { signToken } from '@/utils/auth'; // Import signToken

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/google-register
 * Register or login user with Google Sign-In
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { idToken, name, email, photoUrl } = body;



        // Validation
        if (!email || !name) {
            return NextResponse.json({
                success: false,
                message: 'Email and name are required'
            }, { status: 400 });
        }

        await connectDB();

        // Check if registration is enabled
        const settings = await Settings.findOne({});

        // Determine register source / platform
        const registerSource = body.source || body.registerSource || 'app';
        const platform = registerSource === 'app' ? 'app' : 'web';

        let registrationEnabled = false;
        if (settings?.authSettings) {
            if (platform === 'app') {
                registrationEnabled = settings.authSettings.app?.enableRegistration ?? true;
            } else {
                registrationEnabled = settings.authSettings.web?.enableRegistration ?? true;
            }
        } else {
            // Fallback to legacy settings
            registrationEnabled = settings?.authPages?.enableRegistration ||
                settings?.loginRegister?.enableUserRegistration ||
                false;
        }

        // Check if user already exists
        let user = await User.findOne({ email });
        let isNewUser = false;

        if (user) {
            // Existing user - update device tracking and notification token
            await User.findByIdAndUpdate(user._id, {
                fcmToken: body.fcmToken || user.fcmToken,
                lastActiveAt: new Date()
            });
        } else {
            // New user - check if registration is enabled
            if (!registrationEnabled) {
                return NextResponse.json({
                    success: false,
                    message: 'User registration is currently disabled'
                }, { status: 403 });
            }

            // Generate roll number using the new utility
            const { ensureUniqueRollNumber } = await import('@/utils/rollNumber');
            const rollNumber = await ensureUniqueRollNumber(User, name);

            // Determine register source (already defined above)


            // Create new user
            user = await User.create({
                name,
                email,
                phone: '', // Will be updated later if needed
                password: '', // No password for Google users
                rollNumber,
                role: 'student',
                isActive: true,
                enrolledCourses: [],
                profileImage: photoUrl || null,
                authProvider: 'google',
                registerSource,
                fcmToken: body.fcmToken || null,
                // No category required - skip it
            });

            isNewUser = true;

        }

        if (isNewUser) {
            // Send Admin Notification (Async - do not block response)
            try {
                const { sendAdminNewUserRegistryNotification } = await import('@/lib/sendAdminNotification');
                sendAdminNewUserRegistryNotification(user);
            } catch (notifErr) {
                console.error('Failed to trigger admin notification:', notifErr);
            }
        }

        // Generate unique device ID if not provided in body (fallback for web)
        let finalDeviceId = body.deviceId || body.activeDeviceId;
        if (!finalDeviceId) {
            const userAgent = request.headers.get('user-agent') || '';
            finalDeviceId = Buffer.from(`${email}-${userAgent}-${Date.now()}`).toString('base64').substring(0, 32);
        }

        // Update User with new device info to prevent "Session Expired" force logouts
        await User.findByIdAndUpdate(user._id, {
            activeDeviceId: finalDeviceId,
            lastActiveAt: new Date()
        });

        // Generate JWT Access Token with deviceId
        const token = await signToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            permissions: Array.isArray(user.permissions) ? [...user.permissions] : [],
            accessScope: user.accessScope || 'own',
            deviceId: finalDeviceId
        });

        // Import signRefreshToken dynamically or use from imports if available
        const { signRefreshToken } = await import('@/utils/auth');

        // Generate Refresh Token with full profile
        const refreshToken = await signRefreshToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            permissions: Array.isArray(user.permissions) ? [...user.permissions] : [],
            accessScope: user.accessScope || 'own',
            deviceId: finalDeviceId
        });

        return NextResponse.json({
            success: true,
            isNewUser,
            mobileRequired: !user.phone, // Flag if mobile number is missing
            message: isNewUser ? 'Registration successful' : 'Login successful',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                role: user.role,
                profileImage: user.profileImage
            },
            token,
            refreshToken
        });

    } catch (error) {
        console.error('❌ Google Auth Error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Authentication failed'
        }, { status: 500 });
    }
}
