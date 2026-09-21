import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
// NOTE: do NOT delete require.cache for the User model here. A previous
// `delete require.cache[require.resolve('@/models/User')]` at module scope
// defeated Mongoose's model cache and could throw OverwriteModelError.
import User from '@/models/User';
import Settings from '@/models/Settings';
import { sendOtpEmail } from '@/utils/sendOtpEmail';
import bcrypt from 'bcryptjs';
import { checkOTPRateLimit } from '@/utils/otpRateLimit';
import { generateOtp, checkOtpAttempts, recordFailedOtpAttempt, clearOtpAttempts, otpMatches } from '@/utils/otpAttempts';

export async function POST(request) {
    try {
        const { action, email, otp, newPassword } = await request.json();
        await connectDB();

        if (action === 'send-otp') {
            // Server-side enforcement of the Web Platform "Enable Forgot
            // Password" toggle — previously only checked client-side, so
            // this endpoint would still work even when disabled in admin.
            const settingsDoc = await Settings.findOne({});
            const forgotPasswordEnabled = settingsDoc?.authSettings?.web?.enableForgotPassword ?? true;
            if (!forgotPasswordEnabled) {
                return NextResponse.json({
                    success: false,
                    message: 'Password reset is currently disabled.'
                }, { status: 403 });
            }

            const rateLimit = checkOTPRateLimit(`reset-password:${email}`);
            if (!rateLimit.allowed) {
                return NextResponse.json({
                    success: false,
                    message: rateLimit.message
                }, { status: 429 });
            }

            // Check if email exists
            // 🔒 Coerce to a string so an object like {"$ne": null} can never
            // reach Mongo as a query operator and select an arbitrary account.
            const user = await User.findOne({ email: String(email || '') });
            if (!user) {
                // Don't confirm whether an address is registered.
                return NextResponse.json({
                    success: true,
                    message: 'If that email is registered, a reset code has been sent.',
                    expiresIn: 5 * 60 * 1000
                });
            }

            // Generate OTP with a CSPRNG (Math.random is predictable)
            const resetOtp = generateOtp();
            const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes



            // A freshly issued code starts with a clean guess budget.
            await clearOtpAttempts(User, user._id, 'reset');

            // Save OTP to user
            user.resetOtp = resetOtp;
            user.resetOtpExpiry = otpExpiry;

            // One authoritative write. This used to attempt the same save
            // three ways (Mongoose save -> updateOne -> raw driver) with the
            // logging between them deleted, leaving empty `if` blocks that
            // hid whichever step actually failed.
            user.markModified('resetOtp');
            user.markModified('resetOtpExpiry');
            await user.save();

            // Send OTP email — sendOtpEmail throws on SMTP failure rather than
            // returning success:false, so this needs its own try/catch;
            // otherwise the outer catch turns it into an unhelpful generic
            // "Internal server error" with no hint that SMTP is the problem.
            try {
                const emailSent = await sendOtpEmail(email, 'User', resetOtp, 'Password Reset');
                if (!emailSent || !emailSent.success) {
                    return NextResponse.json({
                        success: false,
                        message: 'Failed to send OTP email. Please try again.'
                    });
                }
            } catch (emailError) {
                console.error('Failed to send password reset OTP email:', emailError);
                return NextResponse.json({
                    success: false,
                    message: 'Could not send the reset email — SMTP is not configured correctly. Please check Settings > Security & SMTP.'
                }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: 'OTP sent to your email successfully',
                expiresIn: 5 * 60 * 1000
            });

        } else if (action === 'verify-otp') {
            const check = await verifyResetOtp(email, otp);
            if (!check.ok) return check.response;

            return NextResponse.json({
                success: true,
                message: 'OTP verified successfully'
            });

        } else if (action === 'reset-password') {
            if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
                return NextResponse.json({
                    success: false,
                    message: 'Password must be between 8 and 128 characters.'
                }, { status: 400 });
            }

            const check = await verifyResetOtp(email, otp);
            if (!check.ok) return check.response;
            const user = check.user;

            await clearOtpAttempts(User, user._id, 'reset');

            // Hash the new password before saving
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password and clear OTP
            user.password = hashedPassword;
            user.resetOtp = undefined;
            user.resetOtpExpiry = undefined;
            await user.save();

            return NextResponse.json({
                success: true,
                message: 'Password reset successfully. You can now login with your new password.'
            });
        }

        return NextResponse.json({
            success: false,
            message: 'Invalid action'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({
            success: false,
            message: 'Internal server error'
        });
    }
}


/**
 * Look up the account and check the reset OTP under a per-account attempt cap.
 *
 * 🔒 SECURITY: the verify-otp and reset-password actions previously had no
 * limit at all (only send-otp was rate limited), so the 6-digit reset code
 * could be enumerated inside its 5-minute window — account takeover for any
 * address. The OTP is also compared in constant time and the account is looked
 * up by a string-coerced email so a query operator can't be injected.
 */
async function verifyResetOtp(email, otp) {
    const fail = (message, status = 400) => ({
        ok: false,
        response: NextResponse.json({ success: false, message }, { status })
    });

    const user = await User.findOne({ email: String(email || '') });
    if (!user) {
        return fail('Invalid or expired OTP. Please request a new one.');
    }

    const attemptState = checkOtpAttempts(user, 'reset');
    if (attemptState.exceeded) {
        return fail('Too many incorrect codes. Please request a new one.', 429);
    }

    const expired = !user.resetOtpExpiry || user.resetOtpExpiry <= new Date();
    if (!user.resetOtp || expired || !otpMatches(user.resetOtp, String(otp ?? ''))) {
        const result = await recordFailedOtpAttempt(
            User,
            user._id,
            'reset',
            ['resetOtp', 'resetOtpExpiry']
        );
        return fail(
            result.exceeded
                ? 'Too many incorrect codes. Please request a new one.'
                : 'Invalid or expired OTP. Please request a new one.',
            result.exceeded ? 429 : 400
        );
    }

    return { ok: true, user };
}
