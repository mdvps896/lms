import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Settings } from '@/models/init';
import { verifyIdToken } from '@/utils/firebaseAdmin';
import { signToken, signRefreshToken } from '@/utils/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/firebase
 * Handles both Google and Email/Password Firebase ID token exchange
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { idToken, deviceId, fcmToken } = body;

        if (!idToken) {
            return NextResponse.json({
                success: false,
                message: 'Firebase ID token is required'
            }, { status: 400 });
        }

        await connectDB();

        // 1. Verify Firebase Token
        const verifyResult = await verifyIdToken(idToken);
        if (!verifyResult.success) {
            return NextResponse.json({
                success: false,
                message: `Invalid Firebase token: ${verifyResult.error}`
            }, { status: 401 });
        }

        const { uid, email, name, picture } = verifyResult.decodedToken;

        // 2. Check registration settings for new users
        let user = await User.findOne({ email });
        let isNewUser = false;

        if (!user) {
            const settings = await Settings.findOne({});
            const registrationEnabled = settings?.authSettings?.app?.enableRegistration ?? true;

            if (!registrationEnabled) {
                return NextResponse.json({
                    success: false,
                    message: 'User registration is currently disabled'
                }, { status: 403 });
            }

            // Create new user
            const { ensureUniqueRollNumber } = await import('@/utils/rollNumber');
            const rollNumber = await ensureUniqueRollNumber(User, name || email.split('@')[0]);

            user = await User.create({
                name: name || email.split('@')[0],
                email,
                firebaseUid: uid,
                rollNumber,
                role: 'student',
                isActive: true,
                authProvider: 'firebase',
                profileImage: picture || null,
                registerSource: 'app'
            });
            isNewUser = true;

            // Send Admin Notification
            try {
                const { sendAdminNewUserRegistryNotification } = await import('@/lib/sendAdminNotification');
                sendAdminNewUserRegistryNotification(user);
            } catch (notifErr) {
                console.error('Failed to trigger admin notification:', notifErr);
            }
        } else {
            // Update existing user
            await User.findByIdAndUpdate(user._id, {
                firebaseUid: uid,
                authProvider: 'firebase', // Update to firebase for migrated users
                fcmToken: fcmToken || user.fcmToken,
                lastActiveAt: new Date(),
                activeDeviceId: deviceId || user.activeDeviceId
            });
        }

        // 3. Generate Backend JWTs
        const finalDeviceId = deviceId || user.activeDeviceId || 'app_device';

        const token = await signToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            deviceId: finalDeviceId
        });

        const refreshToken = await signRefreshToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            deviceId: finalDeviceId
        });

        const userObj = user.toObject();
        delete userObj.password;

        // 🚀 DEBUG: Log successful login to backend terminal
        console.log(`\x1b[32m[AUTH] Firebase Login Successful: ${user.email}\x1b[0m`);
        console.log(`\x1b[36m[TOKEN] ${token}\x1b[0m`);

        return NextResponse.json({
            success: true,
            isNewUser,
            message: 'Authentication successful',
            user: userObj,
            token,
            refreshToken
        });

    } catch (error) {
        console.error('❌ Firebase Auth Route Error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Authentication failed'
        }, { status: 500 });
    }
}
