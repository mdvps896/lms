'use client'
import React, { useState, useRef, useEffect } from 'react'

const OtpVerifyForm = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef([]);

    useEffect(() => {
        // Focus first input on mount
        inputRefs.current[0]?.focus();
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
        console.log('OTP Submitted:', otpValue);
        // Add your verification logic here
    };

    return (
        <>
            <h2 className="fs-20 fw-bolder mb-4">
                Verify Email 
                <a href="#" className="float-end fs-12 text-primary">Change Method</a>
            </h2>
            <h4 className="fs-13 fw-bold mb-2">Please enter the 6-digit code sent to your email.</h4>
            <p className="fs-12 fw-medium text-muted">
                <span>A verification code has been sent to your email address</span>
            </p>
            <form onSubmit={handleSubmit} className="w-100 mt-4 pt-2">
                <div id="otp" className="d-flex justify-content-center gap-2 mt-4 mb-4">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            className="form-control text-center fs-4 fw-bold"
                            style={{ 
                                width: '50px', 
                                height: '50px',
                                fontSize: '24px',
                                borderRadius: '8px',
                                border: '2px solid #dee2e6'
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            required
                        />
                    ))}
                </div>
                <div className="mt-4">
                    <button type="submit" className="btn btn-lg btn-primary w-100">
                        Validate
                    </button>
                </div>
                <div className="mt-4 text-center">
                    <span className="text-muted">Didn't get the code? </span>
                    <a href="#" className="text-primary fw-semibold">Resend Code</a>
                </div>
            </form>
        </>
    )
}

export default OtpVerifyForm