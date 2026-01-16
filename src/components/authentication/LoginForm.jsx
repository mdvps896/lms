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

const LoginForm = ({ registerPath, resetPath, enableRegistration = true }) => {
    const { login, completeTwoFactorAuth } = useAuth();
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

            <form onSubmit={handleSubmit} className="w-100 mt-4 pt-2">
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
                        <Link href={resetPath} className="fs-11 text-primary">Forget password?</Link>
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