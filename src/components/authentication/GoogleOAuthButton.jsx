'use client'
import { useState, useEffect } from 'react'
import { FcGoogle } from 'react-icons/fc'
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import useGoogleAuth from '@/hooks/useGoogleAuth'

const GoogleOAuthButton = ({ type = 'login' }) => {
    const [isEnabled, setIsEnabled] = useState(false)
    const [loading, setLoading] = useState(false)

    // Use Google Auth hook to handle cross-origin issues
    useGoogleAuth()

    // Check if Google OAuth is enabled
    useEffect(() => {
        const checkGoogleOAuth = async () => {
            try {
                const response = await fetch('/api/settings')
                const data = await response.json()



                // Check if Google OAuth is configured
                const googleOAuthEnabled = data.success &&
                    data.data.integrations?.googleOAuth?.enabled &&
                    data.data.integrations.googleOAuth.clientId;

                if (!googleOAuthEnabled) {
                    setIsEnabled(false)
                    return;
                }

                // For login page, also check if registration is enabled
                if (type === 'login') {
                    const registrationEnabled = data.data?.authPages?.enableRegistration !== false;

                    if (!registrationEnabled) {
                        setIsEnabled(false)
                        return;
                    }
                }

                setIsEnabled(true)

            } catch (error) {
                console.error('Error checking Google OAuth status:', error)
                setIsEnabled(false)
            }
        }

        checkGoogleOAuth()
    }, [type])

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true)
        try {
            const decoded = jwtDecode(credentialResponse.credential);

            if (type === 'login') {
                // Use Google register endpoint which handles both login and registration
                const response = await fetch('/api/auth/google-register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: decoded.name,
                        email: decoded.email,
                        photoUrl: decoded.picture,
                        source: 'web'
                    }),
                });

                const data = await response.json();
                if (data.success) {
                    // Login user (works for both new and existing users)
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('token', data.token);

                    // Set cookie for middleware
                    document.cookie = `user=${JSON.stringify(data.user)}; path=/; max-age=86400`;
                    document.cookie = `token=${data.token}; path=/; max-age=86400`;

                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: data.message || 'Login successful with Google!',
                        timer: 2000,
                        showConfirmButton: false
                    });

                    // Redirect to home
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 500);
                } else {
                    // Handle failed login/registration
                    throw new Error(data.message || 'Google authentication failed');
                }
            } else if (type === 'register') {
                // Use Google register endpoint
                const response = await fetch('/api/auth/google-register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: decoded.name,
                        email: decoded.email,
                        photoUrl: decoded.picture,
                        source: 'web'
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    // Store user data and redirect
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('token', data.token);
                    document.cookie = `user=${JSON.stringify(data.user)}; path=/; max-age=86400`;
                    document.cookie = `token=${data.token}; path=/; max-age=86400`;

                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: data.message || 'Registration successful with Google!',
                        timer: 1500,
                        showConfirmButton: false
                    });

                    // Redirect to home
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 500);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Registration Failed',
                        text: data.message || 'Registration failed',
                        timer: 2000
                    });
                }
            }

        } catch (error) {
            // Show specific error message for registration disabled
            const errorMessage = error.message || `Google ${type} failed`;

            Swal.fire({
                icon: 'error',
                title: 'Google Login Failed',
                text: errorMessage,
                timer: errorMessage.includes('Registration is currently disabled') ? 5000 : 2000
            });
        }
        setLoading(false)
    };

    const handleGoogleError = (error) => {
        setLoading(false)
        // Don't show error for user-cancelled operations
        if (error && error.type === 'popup_closed') {
            return // User cancelled, no need to show error
        }

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Google ${type} failed`,
            timer: 2000
        });
    };

    // Don't render if Google OAuth is not enabled
    if (!isEnabled) {
        return null
    }

    return (
        <div className="position-relative d-inline-block w-100">
            {loading && (
                <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75" style={{ zIndex: 10, borderRadius: '6px' }}>
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                disabled={loading}
            />
        </div>
    )
}

export default GoogleOAuthButton