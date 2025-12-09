'use client'
import Link from 'next/link'
import React, { useState } from 'react'
import { FiEye, FiEyeOff, FiMail, FiLock, FiShield } from 'react-icons/fi'
import Swal from 'sweetalert2'

const ResetPasswordForm = ({ loginPath, settings }) => {
    const [currentStep, setCurrentStep] = useState(1); // 1 = Email, 2 = OTP, 3 = New Password
    const [formData, setFormData] = useState({
        email: '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [sentOtp, setSentOtp] = useState('');
    const [otpExpiry, setOtpExpiry] = useState(0);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isResending, setIsResending] = useState(false);

    const isValidEmailProvider = (email) => {
        const validProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com'];
        const domain = email.split('@')[1]?.toLowerCase();
        return validProviders.includes(domain);
    };

    const sendResetOtp = async () => {
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send-otp',
                    email: formData.email
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                setSentOtp(data.otp);
                setOtpExpiry(Date.now() + data.expiresIn);
                return true;
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'Failed to send OTP',
                    timer: 2000
                });
                return false;
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to send OTP email',
                timer: 2000
            });
            return false;
        }
    };

    const verifyOtp = async () => {
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'verify-otp',
                    email: formData.email,
                    otp: formData.otp
                }),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, message: 'Verification failed' };
        }
    };

    const resetPassword = async () => {
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reset-password',
                    email: formData.email,
                    otp: formData.otp,
                    newPassword: formData.newPassword
                }),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, message: 'Password reset failed' };
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0 || isResending) return;

        setIsResending(true);
        const otpSent = await sendResetOtp();
        
        if (otpSent) {
            Swal.fire({
                icon: 'success',
                title: 'OTP Sent!',
                text: `New OTP sent to ${formData.email}`,
                timer: 2000
            });
            
            // Start 30-second cooldown
            setResendCooldown(30);
            const cooldownTimer = setInterval(() => {
                setResendCooldown(prev => {
                    if (prev <= 1) {
                        clearInterval(cooldownTimer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        
        setIsResending(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (currentStep === 1) {
            // Step 1: Validate and send OTP
            if (!formData.email) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Please enter your email address',
                    timer: 2000
                });
                return;
            }

            if (!isValidEmailProvider(formData.email)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Email',
                    text: 'Please use Gmail, Yahoo, Outlook/Bing, or Apple email',
                    timer: 3000
                });
                return;
            }

            Swal.fire({
                title: 'Sending OTP...',
                text: 'Please wait',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const otpSent = await sendResetOtp();
            
            if (otpSent) {
                Swal.close();
                Swal.fire({
                    icon: 'success',
                    title: 'OTP Sent!',
                    text: `OTP sent to ${formData.email}`,
                    timer: 2000
                });
                setCurrentStep(2);
            }
        } else if (currentStep === 2) {
            // Step 2: Verify OTP
            if (!formData.otp || formData.otp.length !== 6) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Please enter 6-digit OTP',
                    timer: 2000
                });
                return;
            }

            // Check OTP expiry
            if (Date.now() > otpExpiry) {
                Swal.fire({
                    icon: 'error',
                    title: 'OTP Expired',
                    text: 'Please request a new OTP',
                    timer: 2000
                });
                setCurrentStep(1);
                return;
            }

            Swal.fire({
                title: 'Verifying OTP...',
                text: 'Please wait',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const result = await verifyOtp();
            Swal.close();

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'OTP Verified!',
                    text: 'Now set your new password',
                    timer: 2000
                });
                setCurrentStep(3);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Verification Failed',
                    text: result.message || 'Invalid OTP',
                    timer: 2000
                });
            }
        } else if (currentStep === 3) {
            // Step 3: Reset Password
            if (!formData.newPassword || !formData.confirmPassword) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Please fill all password fields',
                    timer: 2000
                });
                return;
            }

            if (formData.newPassword !== formData.confirmPassword) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Passwords do not match',
                    timer: 2000
                });
                return;
            }

            if (formData.newPassword.length < 6) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Password must be at least 6 characters',
                    timer: 2000
                });
                return;
            }

            Swal.fire({
                title: 'Resetting Password...',
                text: 'Please wait',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const result = await resetPassword();
            Swal.close();

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Password reset successful! You can now login.',
                    timer: 2000
                }).then(() => {
                    window.location.href = loginPath;
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Reset Failed',
                    text: result.message || 'Password reset failed',
                    timer: 2000
                });
            }
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <>
            <h2 className="fs-20 fw-bolder mb-4">Reset Password</h2>
            
            {/* Progress Indicator */}
            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className={`text-${currentStep >= 1 ? 'primary' : 'muted'}`}>
                        <FiMail className="me-1" />Email
                    </small>
                    <small className={`text-${currentStep >= 2 ? 'primary' : 'muted'}`}>
                        <FiShield className="me-1" />Verify
                    </small>
                    <small className={`text-${currentStep >= 3 ? 'primary' : 'muted'}`}>
                        <FiLock className="me-1" />New Password
                    </small>
                </div>
                <div className="progress" style={{ height: '3px' }}>
                    <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: `${(currentStep / 3) * 100}%` }}
                    ></div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="w-100 mt-4 pt-2">
                {/* Step 1: Email */}
                {currentStep === 1 && (
                    <>
                        <div className="mb-4">
                            <label className="form-label">Email Address</label>
                            <input 
                                type="email" 
                                name="email"
                                className="form-control" 
                                placeholder="Enter your email address" 
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                                required 
                            />
                            <small className="text-muted">We'll send an OTP to this email address</small>
                        </div>
                        <div className="mt-4">
                            <button type="submit" className="btn btn-lg btn-primary w-100">Send OTP</button>
                        </div>
                    </>
                )}

                {/* Step 2: OTP Verification */}
                {currentStep === 2 && (
                    <>
                        <div className="text-center mb-4">
                            <h5 className="mb-2">Verify Email</h5>
                            <p className="text-muted small">
                                Please enter the 6-digit code sent to <br />
                                <strong>{formData.email}</strong>
                            </p>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Enter OTP</label>
                            <input
                                type="text"
                                name="otp"
                                className="form-control form-control-lg text-center"
                                placeholder="Enter 6-digit OTP"
                                value={formData.otp}
                                onChange={(e) => setFormData({...formData, otp: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                                maxLength={6}
                                style={{ letterSpacing: '0.5em', fontSize: '18px' }}
                                required
                            />
                        </div>

                        <div className="text-center mb-3">
                            <small className="text-muted">
                                Code expires in: {Math.floor((otpExpiry - Date.now()) / 60000)}:
                                {String(Math.floor(((otpExpiry - Date.now()) % 60000) / 1000)).padStart(2, '0')}
                            </small>
                        </div>

                        <div className="d-grid mb-3">
                            <button className="btn btn-primary btn-lg" type="submit">
                                Verify OTP
                            </button>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                className={`btn btn-link p-0 me-3 ${resendCooldown > 0 || isResending ? 'text-muted' : 'text-primary'}`}
                                onClick={handleResendOtp}
                                disabled={resendCooldown > 0 || isResending}
                            >
                                {isResending ? 'Sending...' : resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-link text-secondary p-0"
                                onClick={() => setCurrentStep(1)}
                            >
                                ← Change Email
                            </button>
                        </div>
                    </>
                )}

                {/* Step 3: New Password */}
                {currentStep === 3 && (
                    <>
                        <div className="text-center mb-4">
                            <h5 className="mb-2">Set New Password</h5>
                            <p className="text-muted small">
                                Create a strong password for your account
                            </p>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">New Password</label>
                            <div className="input-group">
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    name="newPassword"
                                    className="form-control" 
                                    placeholder="Enter new password" 
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    required 
                                />
                                <div 
                                    className="input-group-text bg-gray-2 c-pointer" 
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FiEyeOff size={16}/> : <FiEye size={16}/>}
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label">Confirm New Password</label>
                            <div className="input-group">
                                <input 
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    className="form-control" 
                                    placeholder="Confirm new password" 
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    required 
                                />
                                <div 
                                    className="input-group-text bg-gray-2 c-pointer" 
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <FiEyeOff size={16}/> : <FiEye size={16}/>}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <button type="submit" className="btn btn-lg btn-primary w-100">Reset Password</button>
                        </div>
                    </>
                )}
            </form>

            <div className="mt-4 text-muted text-center">
                <span>Remember your password? </span>
                <Link href={loginPath} className="fw-bold text-primary">Back to Login</Link>
            </div>
        </>
    )
}

export default ResetPasswordForm