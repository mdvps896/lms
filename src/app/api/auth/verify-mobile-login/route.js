import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/init';
import { signToken } from '@/utils/auth';
import { verifyFirebaseToken } from '@/lib/firebase-admin';

/**
 * POST /api/auth/verify-mobile-login
 * Verify Firebase ID token and login/register user based on phone number
 */
export async function POST(request) {
    try {
        await connectDB();

        const { firebaseToken, name, deviceId, mobile: mobileNumber, otp, sessionId } = await request.json();

        let mobile = mobileNumber;

        // If firebaseToken is provided, use Firebase verification (optional backward compatibility)
        if (firebaseToken) {
            const verificationResult = await verifyFirebaseToken(firebaseToken);
            if (!verificationResult.success) {
                return NextResponse.json(
                    { success: false, message: 'Invalid Firebase token' },
                    { status: 401 }
                );
            }
            mobile = verificationResult.phoneNumber.replace(/^\+91/, '');
        }
        // Otherwise use 2Factor.in verification
        else if (mobileNumber && otp && sessionId) {
            const apiKey = process.env.TWOTACTOR_API_KEY;
            const verifyUrl = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`;

            try {
                const verifyResponse = await fetch(verifyUrl);
                const verifyData = await verifyResponse.json();

                if (verifyData.Status !== 'Success') {
                    return NextResponse.json(
                        { success: false, message: 'Invalid OTP or expired session' },
                        { status: 401 }
                    );
                }
                // Verification successful, mobile is already in mobileNumber
            } catch (error) {
                console.error('2Factor Verification Error:', error);
                return NextResponse.json(
                    { success: false, message: 'OTP verification failed' },
                    { status: 500 }
                );
            }
        } else {
            return NextResponse.json(
                { success: false, message: 'Mobile, OTP and Session ID are required' },
                { status: 400 }
            );
        }

        // Find or create user by mobile number
        let user = await User.findOne({ phone: mobile });
        let isNewUser = false;

        if (!user) {
            // Create new user
            isNewUser = true;

            // Generate roll number for new user
            const { ensureUniqueRollNumber } = await import('@/utils/rollNumber');
            const rollNumber = await ensureUniqueRollNumber(User, name || `User ${mobile}`);

            user = await User.create({
                name: name || `User ${mobile}`,
                email: `${mobile}@mobile.local`,
                phone: mobile,
                rollNumber,
                role: 'student',
                isActive: true,
                emailVerified: true, // Auto-verify for mobile OTP users
                registerSource: 'app',
                authProvider: 'mobile',
                password: Buffer.from(`${mobile}-${Date.now()}`).toString('base64') // Random password
            });
        } else if (!user.isActive) {
            // Activate existing inactive user
            isNewUser = true;

            // Generate roll number
            const { ensureUniqueRollNumber } = await import('@/utils/rollNumber');
            const rollNumber = await ensureUniqueRollNumber(User, name || user.name || `User ${mobile}`);

            await User.findByIdAndUpdate(user._id, {
                name: name || user.name || `User ${mobile}`,
                email: user.email || `${mobile}@mobile.local`,
                rollNumber,
                isActive: true,
                emailVerified: true,
                registerSource: 'app',
                authProvider: 'mobile'
            });

            // Refresh user data
            user = await User.findById(user._id);
        }

        // Update device tracking
        const finalDeviceId = deviceId || Buffer.from(`${mobile}-${Date.now()}`).toString('base64').substring(0, 32);

        await User.findByIdAndUpdate(user._id, {
            activeDeviceId: finalDeviceId,
            lastActiveAt: new Date()
        });

        // Generate JWT Token
        const token = await signToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            deviceId: finalDeviceId
        });

        // Prepare user object for response
        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.mobileOtp;
        delete userObj.mobileOtpExpiry;
        delete userObj.twoFactorOtp;
        delete userObj.resetOtp;

        return NextResponse.json({
            success: true,
            isNewUser,
            message: isNewUser ? 'Registration successful' : 'Login successful',
            data: userObj,
            token
        });

    } catch (error) {
        console.error('Error verifying mobile login:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to verify OTP' },
            { status: 500 }
        );
    }
}
