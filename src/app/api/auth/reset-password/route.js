import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
// Delete cached model to ensure fresh schema
delete require.cache[require.resolve('@/models/User')];
import User from '@/models/User';
import { sendOtpEmail } from '@/utils/sendOtpEmail';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const { action, email, otp, newPassword } = await request.json();
        await connectDB();

        if (action === 'send-otp') {
            // Check if email exists
            const user = await User.findOne({ email });
            if (!user) {
                return NextResponse.json({
                    success: false,
                    message: 'Email not found. Please check your email address.'
                });
            }

            // Generate OTP
            const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

            console.log('Saving OTP to user:', { email, resetOtp, otpExpiry });

            // Save OTP to user
            user.resetOtp = resetOtp;
            user.resetOtpExpiry = otpExpiry;
            
            // Force mark as modified to ensure save
            user.markModified('resetOtp');
            user.markModified('resetOtpExpiry');
            
            const saveResult = await user.save();
            
            console.log('OTP save result:', { 
                success: saveResult ? 'Yes' : 'No',
                userOtp: user.resetOtp,
                userExpiry: user.resetOtpExpiry,
                modifiedPaths: user.modifiedPaths()
            });

            // Verify save by re-fetching user
            const verifyUser = await User.findOne({ email });
            console.log('Verification after save:', {
                userFound: verifyUser ? 'Yes' : 'No',
                savedOtp: verifyUser?.resetOtp,
                savedExpiry: verifyUser?.resetOtpExpiry
            });

            // If save didn't work, try direct update
            if (!verifyUser?.resetOtp) {
                console.log('Direct save failed, trying updateOne...');
                const updateResult = await User.updateOne(
                    { email },
                    { 
                        $set: {
                            resetOtp: resetOtp,
                            resetOtpExpiry: otpExpiry
                        }
                    }
                );
                console.log('Direct update result:', updateResult);
                
                // Try direct MongoDB operation as last resort
                if (updateResult.modifiedCount === 0) {
                    console.log('Mongoose update failed, trying raw MongoDB...');
                    const mongoose = require('mongoose');
                    const db = mongoose.connection.db;
                    const rawUpdateResult = await db.collection('users').updateOne(
                        { email: email },
                        { 
                            $set: {
                                resetOtp: resetOtp,
                                resetOtpExpiry: otpExpiry
                            }
                        }
                    );
                    console.log('Raw MongoDB update result:', rawUpdateResult);
                }
                
                // Verify again
                const verifyUser2 = await User.findOne({ email });
                console.log('Verification after direct update:', {
                    savedOtp: verifyUser2?.resetOtp,
                    savedExpiry: verifyUser2?.resetOtpExpiry
                });
            }

            // Send OTP email
            const emailSent = await sendOtpEmail(email, 'User', resetOtp, 'Password Reset');

            if (!emailSent || !emailSent.success) {
                return NextResponse.json({
                    success: false,
                    message: 'Failed to send OTP email. Please try again.'
                });
            }

            return NextResponse.json({
                success: true,
                message: 'OTP sent to your email successfully',
                otp: resetOtp, // Remove in production
                expiresIn: 5 * 60 * 1000
            });

        } else if (action === 'verify-otp') {
            // Verify OTP
            console.log('Verifying OTP:', { email, otp, currentTime: new Date() });
            
            // First check if user exists with email
            const userExists = await User.findOne({ email });
            console.log('User exists:', userExists ? 'Yes' : 'No');
            
            if (userExists) {
                console.log('User resetOtp data:', {
                    storedOtp: userExists.resetOtp,
                    storedExpiry: userExists.resetOtpExpiry,
                    providedOtp: otp
                });
            }
            
            const user = await User.findOne({ 
                email,
                resetOtp: String(otp),
                resetOtpExpiry: { $gt: new Date() }
            });

            console.log('User found for OTP verification:', user ? 'Yes' : 'No');
            if (user) {
                console.log('User OTP data:', { 
                    storedOtp: user.resetOtp, 
                    providedOtp: otp, 
                    expiryTime: user.resetOtpExpiry,
                    currentTime: new Date(),
                    isExpired: user.resetOtpExpiry < new Date()
                });
            }

            if (!user) {
                return NextResponse.json({
                    success: false,
                    message: 'Invalid or expired OTP. Please request a new one.'
                });
            }

            return NextResponse.json({
                success: true,
                message: 'OTP verified successfully'
            });

        } else if (action === 'reset-password') {
            // Reset password
            const user = await User.findOne({ 
                email,
                resetOtp: String(otp),
                resetOtpExpiry: { $gt: new Date() }
            });

            if (!user) {
                return NextResponse.json({
                    success: false,
                    message: 'Invalid or expired OTP. Please start the process again.'
                });
            }

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