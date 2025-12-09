'use client'
import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

const RegisterOtpVerification = ({ 
    email, 
    onVerifySuccess, 
    onResendOtp, 
    onChangeEmail,
    settings 
}) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const inputRefs = useRef([]);

    useEffect(() => {
        // Focus first input on mount
        inputRefs.current[0]?.focus();
    }, []);

    useEffect(() => {
        // Start countdown timer
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleChange = (index, value) => {
        // Only allow numbers
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = [...otp];
        
        pastedData.split('').forEach((char, index) => {
            if (index < 6) {
                newOtp[index] = char;
            }
        });
        
        setOtp(newOtp);
        
        // Focus last filled input or last input
        const lastIndex = Math.min(pastedData.length, 5);
        inputRefs.current[lastIndex]?.focus();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const otpValue = otp.join('');
        
        if (otpValue.length !== 6) {
            return;
        }
        
        onVerifySuccess(otpValue);
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="row h-100 align-items-center">
            {/* Left side - Image */}
            <div className="col-lg-6 d-none d-lg-block">
                <div className="text-center">
                    <Image 
                        width={500} 
                        height={400} 
                        src={settings?.authPages?.otpVerifyImage || '/images/auth/auth-cover-register-bg.svg'} 
                        alt="OTP Verification" 
                        className="img-fluid" 
                        style={{ maxWidth: '90%' }}
                    />
                </div>
            </div>

            {/* Right side - OTP Form */}
            <div className="col-lg-6">
                <div className="p-4">
                    <div className="mb-4">
                        <h2 className="fs-20 fw-bolder mb-2">
                            Verify Email 
                            <button 
                                type="button"
                                className="btn btn-link float-end fs-12 text-primary p-0"
                                onClick={onChangeEmail}
                            >
                                Change Email
                            </button>
                        </h2>
                        <h4 className="fs-13 fw-bold mb-2">Please enter the 6-digit code sent to your email.</h4>
                        <p className="fs-12 fw-medium text-muted">
                            A verification code has been sent to <strong>{email}</strong>
                        </p>
                        
                        {timeLeft > 0 ? (
                            <div className="alert alert-info py-2 px-3 fs-12">
                                <i className="fas fa-clock me-1"></i>
                                Code expires in: <strong>{formatTime(timeLeft)}</strong>
                            </div>
                        ) : (
                            <div className="alert alert-warning py-2 px-3 fs-12">
                                <i className="fas fa-exclamation-triangle me-1"></i>
                                OTP has expired. Please request a new one.
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="w-100">
                        <div className="d-flex justify-content-center gap-2 mb-4">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    className="form-control text-center fs-4 fw-bold"
                                    style={{ 
                                        width: '60px', 
                                        height: '60px',
                                        fontSize: '24px',
                                        borderRadius: '12px',
                                        border: '2px solid #dee2e6',
                                        transition: 'all 0.2s',
                                        boxShadow: digit ? '0 0 0 2px rgba(13, 110, 253, 0.25)' : 'none'
                                    }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePaste : undefined}
                                    disabled={timeLeft === 0}
                                    required
                                />
                            ))}
                        </div>

                        <div className="mt-4">
                            <button 
                                type="submit" 
                                className="btn btn-lg btn-primary w-100"
                                disabled={otp.join('').length !== 6 || timeLeft === 0}
                            >
                                {timeLeft === 0 ? 'OTP Expired' : 'Verify & Register'}
                            </button>
                        </div>

                        <div className="mt-4 text-center">
                            <span className="text-muted">Didn't get the code? </span>
                            <button 
                                type="button"
                                className="btn btn-link text-primary fw-semibold p-0"
                                onClick={() => {
                                    onResendOtp();
                                    setOtp(['', '', '', '', '', '']);
                                    setTimeLeft(300);
                                }}
                                disabled={timeLeft > 240} // Disable for first minute
                            >
                                {timeLeft > 240 ? `Wait ${Math.ceil((timeLeft - 240) / 60)}m` : 'Resend Code'}
                            </button>
                        </div>

                        <div className="mt-3 text-center">
                            <button 
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={onChangeEmail}
                            >
                                ← Back to Registration
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default RegisterOtpVerification