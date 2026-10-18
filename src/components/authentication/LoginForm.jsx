'use client'

import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import { seedDefaultUsers } from '@/utils/seedUsers'
import Swal from 'sweetalert2'
import GoogleOAuthButton from './GoogleOAuthButton'
import GoogleRecaptcha from './GoogleRecaptcha'
import TwoFactorVerification from './TwoFactorVerification'

const LoginForm = ({ registerPath, resetPath, enableRegistration = true, enableForgotPassword = true, enableMobileOTP = false, otpChannels = [] }) => {
    const { login, completeTwoFactorAuth } = useAuth();

    // Mobile OTP login (enabled from Settings → Login & Register Settings → Web)
    const [otpMode, setOtpMode] = useState(false);
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [lastChannel, setLastChannel] = useState(undefined);
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendIn, setResendIn] = useState(0);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [lockoutTime, setLockoutTime] = useState(0); // in seconds

    // 2FA state
    const [showTwoFactor, setShowTwoFactor] = useState(false);
    const [twoFactorData, setTwoFactorData] = useState(null);

    useEffect(() => {
        let timer;
        if (lockoutTime > 0) {
            timer = setInterval(() => {
                setLockoutTime((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [lockoutTime]);

    useEffect(() => {
        if (resendIn <= 0) return;
        const timer = setTimeout(() => setResendIn(resendIn - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendIn]);

    const sendOtp = async (channel) => {
        if (!/^[0-9]{10}$/.test(mobile)) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Enter a valid 10-digit mobile number', timer: 2000 });
            return;
        }
        setOtpLoading(true);
        try {
            const res = await fetch('/api/auth/send-mobile-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, platform: 'web', channel })
            });
            const data = await res.json();
            if (data.success) {
                setOtpSent(true);
                setSessionId(data.sessionId || '');
                setLastChannel(channel);
                setOtp('');
                setResendIn(30);
                Swal.fire({
                    icon: 'success',
                    title: 'OTP Sent',
                    text: `OTP sent to ${mobile}${channel === 'whatsapp' ? ' on WhatsApp' : ''}`,
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                Swal.fire({ icon: 'error', title: 'Could not send OTP', text: data.message || 'Please try again', timer: 3000 });
            }
        } catch {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Could not send OTP', timer: 2000 });
        } finally {
            setOtpLoading(false);
        }
    };

    const verifyOtp = async (e) => {
        e.preventDefault();
        // Before the OTP is sent, Enter should send on the first channel.
        if (!otpSent) return sendOtp(otpChannels[0]);
        if (!/^[0-9]{4,9}$/.test(otp)) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Enter the OTP you received', timer: 2000 });
            return;
        }
        setOtpLoading(true);
        try {
            const res = await fetch('/api/auth/verify-mobile-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, otp, sessionId, platform: 'web' })
            });
            const data = await res.json();
            if (data.success) {
                // Same finish as a 2FA login: stores the user and goes to the dashboard.
                completeTwoFactorAuth(data.data);
            } else {
                Swal.fire({ icon: 'error', title: 'Login Failed', text: data.message || 'Invalid OTP', timer: 3000 });
            }
        } catch {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Could not verify OTP', timer: 2000 });
        } finally {
            setOtpLoading(false);
        }
    };

    const switchMode = (toOtp) => {
        setOtpMode(toOtp);
        setOtpSent(false);
        setOtp('');
        setResendIn(0);
    };

    useEffect(() => {
        // Seed default users on component mount
        seedDefaultUsers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (lockoutTime > 0) return;

        if (!formData.email || !formData.password) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please enter email and password',
                timer: 2000
            });
            return;
        }

        setIsLoading(true);
        try {
            // Execute reCAPTCHA if available
            if (window.executeRecaptcha) {
                const recaptchaResult = await window.executeRecaptcha('login')
                if (!recaptchaResult.success) {
                    // Security check failed but bypassed for now
                    console.warn('reCAPTCHA validation failed but proceeding:', recaptchaResult);
                    /* 
                    Swal.fire({
                        icon: 'error',
                        title: 'Security Check Failed',
                        text: 'Please try again',
                        timer: 2000
                    });
                    return;
                    */
                }
            }

            const result = await login(formData.email, formData.password);

            if (result.success) {
                if (result.requiresTwoFactor) {
                    // Show 2FA verification
                    setTwoFactorData({
                        userId: result.userId,
                        email: result.email
                    });
                    setShowTwoFactor(true);

                    Swal.fire({
                        icon: 'info',
                        title: 'Two-Factor Authentication',
                        text: result.message,
                        timer: 3000
                    });
                } else {
                    // Normal login success
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: 'Login successful!',
                        timer: 1500,
                        showConfirmButton: false
                    });
                }
            } else {
                if (result.locked) {
                    setLockoutTime(result.remainingTime || 600);
                    Swal.fire({
                        icon: 'error',
                        title: 'Access Blocked',
                        text: result.message,
                        timer: result.remainingTime ? result.remainingTime * 1000 : 5000,
                        timerProgressBar: true
                    });
                    return;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    text: result.message || 'Invalid email or password',
                    timer: 2000
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleTwoFactorSuccess = (userData) => {
        setShowTwoFactor(false);
        completeTwoFactorAuth(userData);
    };

    const handleBackToLogin = () => {
        setShowTwoFactor(false);
        setTwoFactorData(null);
        setFormData({ email: '', password: '' });
    };

    // If showing 2FA, render the verification component
    if (showTwoFactor && twoFactorData) {
        return (
            <div className="text-center">
                <TwoFactorVerification
                    userId={twoFactorData.userId}
                    email={twoFactorData.email}
                    onSuccess={handleTwoFactorSuccess}
                />
                <div className="mt-3">
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={handleBackToLogin}
                    >
                        ← Back to Login
                    </button>
                </div>
            </div>
        );
    }

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const decoded = jwtDecode(credentialResponse.credential);

            // Try to login first
            let response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: decoded.email,
                    password: 'google_oauth_' + decoded.sub
                }),
            });

            let data = await response.json();
            let isNewUser = false;

            // If user doesn't exist, create new account automatically
            if (!data.success) {
                response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: decoded.name,
                        email: decoded.email,
                        password: 'google_oauth_' + decoded.sub,
                        role: 'student',
                        isGoogleAuth: true,
                        emailVerified: true,
                    }),
                });
                data = await response.json();
                isNewUser = true;
            }

            if (data.success) {
                // Login user (works for both new and existing users)
                localStorage.setItem('user', JSON.stringify(data.data));

                // Set cookie for middleware
                document.cookie = `user=${JSON.stringify(data.data)}; path=/; max-age=86400`;

                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: isNewUser
                        ? 'Account created & logged in successfully with Google!'
                        : 'Login successful with Google!',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Redirect to home
                setTimeout(() => {
                    window.location.href = '/';
                }, 500);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Google login failed',
                    timer: 2000
                });
            }

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Google login failed',
                timer: 2000
            });
        }
    };

    const handleGoogleError = () => {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Google login failed',
            timer: 2000
        });
    };

    return (
        <>
            <h2 className="fs-20 fw-bolder mb-4">Login</h2>

            {otpMode && (
                <form onSubmit={verifyOtp} className="w-100 mt-4 pt-2">
                    <div className="mb-3">
                        <input
                            type="tel"
                            inputMode="numeric"
                            className="form-control"
                            placeholder="Mobile number (10 digits)"
                            value={mobile}
                            maxLength={10}
                            disabled={otpSent || otpLoading}
                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            autoComplete="tel-national"
                            required
                        />
                    </div>
                    {otpSent && (
                        <div className="mb-3">
                            <input
                                type="text"
                                inputMode="numeric"
                                className="form-control"
                                placeholder="Enter OTP"
                                value={otp}
                                maxLength={9}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                autoComplete="one-time-code"
                                autoFocus
                                required
                            />
                            <div className="d-flex justify-content-between mt-2 fs-11">
                                <button
                                    type="button"
                                    className="btn btn-link p-0 fs-11"
                                    onClick={() => { setOtpSent(false); setOtp(''); }}
                                >
                                    Change number
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-link p-0 fs-11"
                                    disabled={resendIn > 0 || otpLoading}
                                    onClick={() => sendOtp(lastChannel)}
                                >
                                    {resendIn > 0 ? `Resend OTP in ${resendIn}s` : 'Resend OTP'}
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="mt-4 d-grid gap-2">
                        {otpSent ? (
                            <button
                                type="submit"
                                className="btn btn-lg btn-primary w-100"
                                disabled={otpLoading}
                                style={{ minHeight: '48px' }}
                            >
                                {otpLoading ? 'Please wait...' : 'Verify & Login'}
                            </button>
                        ) : otpChannels.length > 1 ? (
                            // Several channels on: one button per channel.
                            <>
                                <button
                                    type="button"
                                    className="btn btn-lg btn-primary w-100"
                                    disabled={otpLoading}
                                    style={{ minHeight: '48px' }}
                                    onClick={() => sendOtp('sms')}
                                >
                                    {otpLoading ? 'Please wait...' : 'Send OTP on SMS'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-lg btn-success w-100"
                                    disabled={otpLoading}
                                    style={{ minHeight: '48px' }}
                                    onClick={() => sendOtp('whatsapp')}
                                >
                                    {otpLoading ? 'Please wait...' : 'Send OTP on WhatsApp'}
                                </button>
                            </>
                        ) : (
                            <button
                                type="submit"
                                className="btn btn-lg btn-primary w-100"
                                disabled={otpLoading}
                                style={{ minHeight: '48px' }}
                            >
                                {otpLoading ? 'Please wait...' : otpChannels[0] === 'whatsapp' ? 'Send OTP on WhatsApp' : 'Send OTP'}
                            </button>
                        )}
                    </div>
                    <div className="text-center mt-3">
                        <button type="button" className="btn btn-link fs-12" onClick={() => switchMode(false)}>
                            Login with Email &amp; Password
                        </button>
                    </div>
                </form>
            )}

            <form onSubmit={handleSubmit} className="w-100 mt-4 pt-2" hidden={otpMode}>
                <div className="mb-4">
                    <input
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder="Email or Username"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <div className="input-group">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            className="form-control"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                            required
                        />
                        <div
                            className="input-group-text bg-gray-2 c-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                            data-toggle="tooltip"
                            data-title="Show/Hide Password"
                        >
                            {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                        </div>
                    </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                    <div>
                        <div className="custom-control custom-checkbox">
                            <input
                                type="checkbox"
                                className="custom-control-input"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <label className="custom-control-label c-pointer" htmlFor="rememberMe">Remember Me</label>
                        </div>
                    </div>
                    <div>
                        {enableForgotPassword && (
                            <Link href={resetPath} className="fs-11 text-primary">Forget password?</Link>
                        )}
                    </div>
                </div>
                <div className="mt-5">
                    <button
                        type="submit"
                        className={`btn btn-lg btn-primary w-100 position-relative ${lockoutTime > 0 ? 'disabled' : ''}`}
                        disabled={isLoading || lockoutTime > 0}
                        style={{ minHeight: '48px' }}
                    >
                        {isLoading && (
                            <div
                                className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                                style={{
                                    backgroundColor: 'rgba(13, 110, 253, 0.8)',
                                    borderRadius: 'inherit'
                                }}
                            >
                                <div
                                    className="spinner-border spinner-border-sm text-white"
                                    role="status"
                                    style={{ width: '1.2rem', height: '1.2rem' }}
                                >
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        )}
                        <span style={{ opacity: isLoading ? 0 : 1 }}>
                            {lockoutTime > 0
                                ? `Try again in ${formatTime(lockoutTime)}`
                                : 'Login'
                            }
                        </span>
                    </button>
                </div>

                {enableMobileOTP && (
                    <div className="text-center mt-3">
                        <button type="button" className="btn btn-link fs-12" onClick={() => switchMode(true)}>
                            Login with Mobile OTP
                        </button>
                    </div>
                )}

                {/* reCAPTCHA Component */}
                <GoogleRecaptcha
                    onVerify={(token, score) => { }}
                    onError={(error) => { }}
                />
            </form>

            {/* Google OAuth Button - After form */}
            <div className="w-100 mt-4 text-center">
                <div className="mb-3 border-bottom position-relative">
                    <span className="small py-1 px-3 text-uppercase text-muted bg-white position-absolute translate-middle">or</span>
                </div>
                <GoogleOAuthButton type="login" />
            </div>

            <div className="w-100 mt-5 text-center mx-auto">
                <div className="mt-5 text-muted">
                    <span> Don't have an account?</span>
                    {enableRegistration && (
                        <Link href={registerPath} className="fw-bold"> Create an Account</Link>
                    )}
                    {!enableRegistration && (
                        <span className="text-muted"> Registration is currently disabled</span>
                    )}
                </div>
            </div>
        </>
    )
}

export default LoginForm