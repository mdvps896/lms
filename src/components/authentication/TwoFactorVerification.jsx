'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiMail, FiRefreshCw, FiShield } from 'react-icons/fi';
import Swal from 'sweetalert2';

const TwoFactorVerification = ({ userId, email, onSuccess }) => {
    const [otp, setOtp] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const router = useRouter();

    // Countdown timer
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!otp || otp.length !== 6) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Code',
                text: 'Please enter a 6-digit verification code',
                timer: 2000
            });
            return;
        }

        setIsVerifying(true);
        try {
            const response = await fetch('/api/auth/verify-2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, otp }),
            });

            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Verification Successful',
                    text: 'Two-factor authentication completed',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                // Call the success callback with user data
                onSuccess(data.data);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Verification Failed',
                    text: data.message || 'Invalid verification code',
                    timer: 2000
                });
            }
        } catch (error) {
            console.error('2FA verification error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Verification failed. Please try again.',
                timer: 2000
            });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendOtp = async () => {
        setIsResending(true);
        try {
            const response = await fetch('/api/auth/resend-2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Code Resent',
                    text: 'New verification code sent to your email',
                    timer: 2000
                });
                setTimeLeft(600); // Reset timer
                setOtp(''); // Clear current OTP
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Resend Failed',
                    text: data.message || 'Failed to resend verification code',
                    timer: 2000
                });
            }
        } catch (error) {
            console.error('2FA resend error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to resend code. Please try again.',
                timer: 2000
            });
        } finally {
            setIsResending(false);
        }
    };

    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Only allow numbers
        if (value.length <= 6) {
            setOtp(value);
        }
    };

    return (
        <div>
            <div className="p-4">
                <div className="text-center mb-4">
                    <div className="mb-3">
                        <FiShield size={48} className="text-primary" />
                    </div>
                    <h4 className="card-title mb-2">Two-Factor Authentication</h4>
                    <p className="text-muted">
                        We have sent a 6-digit verification code to your email
                    </p>
                </div>

                <div className="alert alert-info d-flex align-items-center mb-4">
                    <FiMail className="me-2" />
                    <div>
                        <small className="mb-0">
                            <strong>Sent to:</strong> {email}
                        </small>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="form-label">Verification Code</label>
                        <input 
                            type="text"
                            className="form-control form-control-lg text-center letter-spacing-2"
                            placeholder="000000"
                            value={otp}
                            onChange={handleOtpChange}
                            maxLength={6}
                            autoComplete="off"
                            style={{ 
                                fontSize: '1.5rem', 
                                letterSpacing: '0.5rem',
                                fontWeight: 'bold'
                            }}
                            required
                        />
                        <div className="form-text text-center mt-2">
                            Enter the 6-digit code sent to your email
                        </div>
                    </div>

                    <div className="d-grid gap-2 mb-4">
                        <button 
                            type="submit" 
                            className="btn btn-primary btn-lg position-relative"
                            disabled={isVerifying || otp.length !== 6}
                            style={{ minHeight: '48px' }}
                        >
                            {isVerifying && (
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
                            <span style={{ opacity: isVerifying ? 0 : 1 }}>Verify Code</span>
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <div className="mb-3">
                        <small className="text-muted">
                            {timeLeft > 0 ? (
                                <>Code expires in <strong>{formatTime(timeLeft)}</strong></>
                            ) : (
                                <span className="text-danger">Code has expired</span>
                            )}
                        </small>
                    </div>
                    
                    <button 
                        type="button"
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center mx-auto"
                        onClick={handleResendOtp}
                        disabled={isResending}
                        style={{ minWidth: '140px' }}
                    >
                        {isResending ? (
                            <>
                                <div 
                                    className="spinner-border spinner-border-sm me-2" 
                                    role="status"
                                    style={{ width: '1rem', height: '1rem' }}
                                >
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                Resending...
                            </>
                        ) : (
                            <>
                                <FiRefreshCw className="me-2" size={14} />
                                Resend Code
                            </>
                        )}
                    </button>
                </div>

                <div className="mt-4 pt-3 border-top text-center">
                    <small className="text-muted">
                        Having trouble? Contact your system administrator
                    </small>
                </div>
            </div>
        </div>
    );
};

export default TwoFactorVerification;