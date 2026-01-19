import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';
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
        const settings = await db.collection('settings').findOne({});

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
            // Existing user - just login

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
            const rollNumber = await ensureUniqueRollNumber(User);

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
                // No category required - skip it
            });

            isNewUser = true;

        }

        // Generate proper JWT Token using auth utility
        const token = await signToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role
        });

        return NextResponse.json({
            success: true,
            isNewUser,
            message: isNewUser ? 'Registration successful' : 'Login successful',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                role: user.role,
                profileImage: user.profileImage
            },
            token
        });

    } catch (error) {
        console.error('❌ Google Auth Error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Authentication failed'
        }, { status: 500 });
    }
}
