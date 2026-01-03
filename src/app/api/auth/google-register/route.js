import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/google-register
 * Register or login user with Google Sign-In
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { idToken, name, email, photoUrl } = body;

        console.log(`🔐 [Google Auth] Attempt - Email: ${email}`);

        // Validation
        if (!email || !name) {
            return NextResponse.json({
                success: false,
                message: 'Email and name are required'
            }, { status: 400 });
        }

        await connectDB();

        // Check if registration is enabled
        const db = mongoose.connection.db;
        const settings = await db.collection('settings').findOne({});
        const registrationEnabled = settings?.authPages?.enableRegistration ||
            settings?.loginRegister?.enableUserRegistration ||
            false;

        // Check if user already exists
        let user = await User.findOne({ email });
        let isNewUser = false;

        if (user) {
            // Existing user - just login
            console.log(`✅ [Google Auth] Existing user login - ${user.name}`);
        } else {
            // New user - check if registration is enabled
            if (!registrationEnabled) {
                return NextResponse.json({
                    success: false,
                    message: 'User registration is currently disabled'
                }, { status: 403 });
            }

            // Generate roll number
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));

            const todayCount = await User.countDocuments({
                createdAt: { $gte: startOfDay, $lte: endOfDay },
                role: 'student'
            });

            const sequence = String(todayCount + 1).padStart(3, '0');
            const rollNumber = `ST-${dateStr}-${sequence}`;

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
                profileImage: photoUrl || '',
                authProvider: 'google',
                // No category required - skip it
            });

            isNewUser = true;
            console.log(`✅ [Google Auth] New user registered - ${user.name} (${user._id})`);
        }

        // Generate token
        const token = Buffer.from(`${user._id}:${Date.now()}`).toString('base64');

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
