'use client'

import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { FiEye, FiEyeOff, FiHash } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import Swal from 'sweetalert2'
import GoogleOAuthButton from './GoogleOAuthButton'
import GoogleRecaptcha from './GoogleRecaptcha'

const RegisterForm = ({ path, settings }) => {
    const { register } = useAuth();
    const [currentStep, setCurrentStep] = useState(1); // 1 = Details, 2 = OTP
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        category: ''
    });
    const [categories, setCategories] = useState([]);
    const [otp, setOtp] = useState('');
    const [sentOtp, setSentOtp] = useState('');
    const [otpExpiry, setOtpExpiry] = useState(0);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isResending, setIsResending] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [showTermsModal, setShowTermsModal] = useState(false);

    // Fetch categories on component mount
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            // Silent failure
        }
    };

    const checkPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*]/.test(password)) strength++;
        return Math.min(strength, 4);
    };

    const generatePassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, password, confirmPassword: password });
        setPasswordStrength(checkPasswordStrength(password));
    };

    // Validate email provider
    const isValidEmailProvider = (email) => {
        const validProviders = [
            'gmail.com',
            'yahoo.com', 'yahoo.co.in',
            'outlook.com', 'hotmail.com', 'live.com',
            'icloud.com', 'me.com', 'mac.com'
        ];
        const domain = email.split('@')[1]?.toLowerCase();
        return validProviders.includes(domain);
    };

    // Send OTP to email
    const sendOtpEmail = async () => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    name: formData.name,
                    mobile: formData.phone  // Send as 'mobile' to match API
                })
            });

            const data = await response.json();


            if (data.success && data.requiresOtp) {
                // OTP sent successfully
                setOtpExpiry(Date.now() + 600000); // 10 minutes
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

    // Verify OTP and register
    const handleVerifyOtp = async (otpValue) => {
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

        // Verify OTP
        if (otpValue !== sentOtp) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid OTP',
                text: 'Please enter correct OTP',
                timer: 2000
            });
            return;
        }

        // Show loading
        Swal.fire({
            title: 'Creating Account...',
            text: 'Please wait',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Register user
        const result = await register({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            emailVerified: true
        });

        Swal.close();

        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Registration successful! Email verified.',
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Registration Failed',
                text: result.message || 'Registration failed',
                timer: 2000
            });
        }
    };

    // Resend OTP
    const handleResendOtp = async () => {
        if (resendCooldown > 0 || isResending) return;

        setIsResending(true);
        const otpSent = await sendOtpEmail();

        if (otpSent) {
            Swal.fire({
                icon: 'success',
                title: 'OTP Sent!',
                text: `New verification code sent to ${formData.email}`,
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

    // Change email - go back to step 1
    const handleChangeEmail = () => {
        setCurrentStep(1);
        setOtp('');
        setSentOtp('');
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (currentStep === 1) {
            // Step 1: Validate and send OTP
            if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Please fill all fields',
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

            if (formData.password !== formData.confirmPassword) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Passwords do not match',
                    timer: 2000
                });
                return;
            }

            if (formData.password.length < 6) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Password must be at least 6 characters',
                    timer: 2000
                });
                return;
            }

            if (!agreedToTerms) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Please accept Terms & Conditions',
                    timer: 2000
                });
                return;
            }

            // Execute reCAPTCHA if available
            if (window.executeRecaptcha) {
                const recaptchaResult = await window.executeRecaptcha('register')
                if (!recaptchaResult.success) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Security Check Failed',
                        text: 'Please try again',
                        timer: 2000
                    });
                    return;
                }
            }

            // Send OTP
            Swal.fire({
                title: 'Sending OTP...',
                text: 'Please wait',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const otpSent = await sendOtpEmail();

            if (otpSent) {
                Swal.close();
                Swal.fire({
                    icon: 'success',
                    title: 'OTP Sent!',
                    text: `Verification code sent to ${formData.email}`,
                    timer: 2000
                });
                setCurrentStep(2); // Move to OTP step
            }
        } else if (currentStep === 2) {
            // Step 2: Verify OTP and register
            if (!otp || otp.length !== 6) {
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

            // Show loading for registration
            Swal.fire({
                title: 'Verifying OTP...',
                text: 'Please wait',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Verify OTP and complete registration
            try {
                const response = await fetch('/api/auth/verify-registration-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        otp: otp,
                        name: formData.name,
                        mobile: formData.phone,
                        password: formData.password
                    })
                });

                const data = await response.json();

                Swal.close();

                if (data.success) {
                    // Store user data and redirect
                    localStorage.setItem('user', JSON.stringify(data.user));
                    document.cookie = `user=${JSON.stringify(data.user)}; path=/; max-age=86400`;

                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Registration successful! Email verified.',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = '/';
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Verification Failed',
                        text: data.message || 'OTP verification failed',
                        timer: 2000
                    });
                }
            } catch (error) {
                Swal.close();
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to verify OTP',
                    timer: 2000
                });
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        if (name === 'password') {
            setPasswordStrength(checkPasswordStrength(value));
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const decoded = jwtDecode(credentialResponse.credential);

            // Register with Google data (skip OTP verification)
            const result = await register({
                name: decoded.name,
                email: decoded.email,
                phone: '', // Google doesn't provide phone
                password: 'google_oauth_' + decoded.sub, // Use Google ID as password
                isGoogleAuth: true,
                emailVerified: true // Google emails are already verified
            });

            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Registration successful with Google! No OTP needed.',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Registration Failed',
                    text: result.message || 'Registration failed',
                    timer: 2000
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Google sign up failed',
                timer: 2000
            });
        }
    };

    const handleGoogleError = () => {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Google sign up failed',
            timer: 2000
        });
    };

    return (
        <>
            <h2 className="fs-20 fw-bolder mb-3">Register {currentStep === 2 && '- Verify Email'}</h2>

            {currentStep === 1 ? (
                // Step 1: Registration Form
                <form onSubmit={handleSubmit} className="w-100 mt-3 pt-1">
                    <div className="mb-3">
                        <input
                            type="text"
                            name="name"
                            className="form-control"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <div className="input-group">
                            <span className="input-group-text">
                                <img src="/images/flags/1x1/in.svg" alt="India" style={{ width: '20px', height: '15px' }} />
                                <span className="ms-2">+91</span>
                            </span>
                            <input
                                type="tel"
                                name="phone"
                                className="form-control"
                                placeholder="Phone Number"
                                value={formData.phone}
                                onChange={handleChange}
                                pattern="[0-9]{10}"
                                maxLength="10"
                                required
                            />
                        </div>
                    </div>
                    <div className="mb-3">
                        <select
                            name="category"
                            className="form-control"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Category</option>
                            {categories.map(category => (
                                <option key={category._id} value={category._id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-3 generate-pass">
                        <div className="input-group field">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                className="form-control password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                                required
                            />
                            <div
                                className="input-group-text c-pointer gen-pass"
                                onClick={generatePassword}
                                data-toggle="tooltip"
                                data-title="Generate Password"
                            >
                                <FiHash size={16} />
                            </div>
                            <div
                                className="input-group-text border-start bg-gray-2 c-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                                data-toggle="tooltip"
                                data-title="Show/Hide Password"
                            >
                                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </div>
                        </div>
                        <div className="progress-bar mt-1">
                            <div className={passwordStrength >= 1 ? 'active' : ''}></div>
                            <div className={passwordStrength >= 2 ? 'active' : ''}></div>
                            <div className={passwordStrength >= 3 ? 'active' : ''}></div>
                            <div className={passwordStrength >= 4 ? 'active' : ''}></div>
                        </div>
                    </div>
                    <div className="mb-3">
                        <div className="input-group">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                className="form-control"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                autoComplete="new-password"
                                required
                            />
                            <div
                                className="input-group-text bg-gray-2 c-pointer"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                data-toggle="tooltip"
                                data-title="Show/Hide Password"
                            >
                                {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </div>
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="custom-control custom-checkbox">
                            <input
                                type="checkbox"
                                className="custom-control-input"
                                id="termsCondition"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                required
                            />
                            <label className="custom-control-label c-pointer text-muted" htmlFor="termsCondition" style={{ fontWeight: '400 !important' }}>
                                I agree to all the <a href="#" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="text-primary">Terms &amp; Conditions</a>
                            </label>
                        </div>
                    </div>
                    <div className="mt-4">
                        <button type="submit" className="btn btn-lg btn-primary w-100">Send OTP</button>
                    </div>

                    {/* reCAPTCHA Component */}
                    <GoogleRecaptcha
                        onVerify={(token, score) => { }}
                        onError={(error) => { }}
                    />
                </form>
            ) : (
                // Step 2: OTP Verification - Inline Form
                <form onSubmit={handleSubmit} className="w-100 mt-3 pt-1">
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
                            className="form-control form-control-lg text-center"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
                        <button
                            className="btn btn-primary btn-lg"
                            type="submit"
                        >
                            Verify & Register
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
                            onClick={handleChangeEmail}
                        >
                            ← Change Email
                        </button>
                    </div>
                </form>
            )}

            {/* Google Sign Up Button - Only show on Step 1 */}
            {currentStep === 1 && (
                <div className="w-100 mt-3 text-center mx-auto">
                    <div className="mb-3 border-bottom position-relative">
                        <span className="small py-1 px-3 text-uppercase text-muted bg-white position-absolute translate-middle">or</span>
                    </div>
                    <GoogleOAuthButton type="register" />
                </div>
            )}

            <div className="mt-4 text-muted">
                <span>Already have an account?</span>
                <Link href={path} className="fw-bold"> Login</Link>
            </div>

            {/* Terms & Conditions Modal */}
            {showTermsModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowTermsModal(false)}>
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Terms & Conditions</h5>
                                <button type="button" className="btn-close" onClick={() => setShowTermsModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                {settings?.authPages?.termsConditions ? (
                                    <div dangerouslySetInnerHTML={{ __html: settings.authPages.termsConditions }} />
                                ) : (
                                    <>
                                        <h6 className="fw-bold mb-3">1. Acceptance of Terms</h6>
                                        <p className="text-muted mb-4">By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.</p>

                                        <h6 className="fw-bold mb-3">2. User Accounts</h6>
                                        <p className="text-muted mb-4">You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>

                                        <h6 className="fw-bold mb-3">3. Privacy Policy</h6>
                                        <p className="text-muted mb-4">Your use of this platform is also governed by our Privacy Policy. We collect and process your personal information in accordance with applicable data protection laws.</p>

                                        <h6 className="fw-bold mb-3">4. User Conduct</h6>
                                        <p className="text-muted mb-4">You agree not to use the platform for any unlawful purpose or any purpose prohibited under this clause. You agree not to use the platform in any way that could damage the platform or impair anyone else's use of it.</p>

                                        <h6 className="fw-bold mb-3">5. Intellectual Property</h6>
                                        <p className="text-muted mb-4">All content included on this platform is protected by applicable copyright and trademark law.</p>

                                        <h6 className="fw-bold mb-3">6. Limitation of Liability</h6>
                                        <p className="text-muted mb-4">We shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of the platform.</p>

                                        <h6 className="fw-bold mb-3">7. Termination</h6>
                                        <p className="text-muted mb-0">We reserve the right to terminate or suspend your account at any time without prior notice for violating these terms.</p>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowTermsModal(false)}>Close</button>
                                <button type="button" className="btn btn-primary" onClick={() => { setAgreedToTerms(true); setShowTermsModal(false); }}>Accept Terms</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default RegisterForm