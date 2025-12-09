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
                
                console.log('Checking Google OAuth settings:', data.data?.integrations?.googleOAuth)
                
                // Check if Google OAuth is configured
                const googleOAuthEnabled = data.success && 
                    data.data.integrations?.googleOAuth?.enabled && 
                    data.data.integrations.googleOAuth.clientId;
                
                if (!googleOAuthEnabled) {
                    console.log('Google OAuth is disabled or not properly configured in database')
                    setIsEnabled(false)
                    return;
                }
                
                // For login page, also check if registration is enabled
                if (type === 'login') {
                    const registrationEnabled = data.data?.authPages?.enableRegistration !== false;
                    
                    if (!registrationEnabled) {
                        console.log('Google OAuth login disabled because registration is disabled')
                        setIsEnabled(false)
                        return;
                    }
                }
                
                console.log('Google OAuth is enabled with Client ID:', data.data.integrations.googleOAuth.clientId)
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

                // If login failed, check if user exists by email first
                if (!data.success) {
                    console.log('Initial login failed, checking if user exists...', data);
                    
                    // Check if user exists by email
                    const checkUserResponse = await fetch('/api/auth/check-user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: decoded.email }),
                    });
                    
                    const checkUserData = await checkUserResponse.json();
                    console.log('Check user response:', checkUserData);
                    
                    if (checkUserData.success && checkUserData.userExists) {
                        console.log('User exists, updating password for Google OAuth...');
                        // User exists but login failed - might be different password
                        // For Google OAuth users, update their password and login
                        const updateResponse = await fetch('/api/auth/update-google-password', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                email: decoded.email,
                                password: 'google_oauth_' + decoded.sub,
                                isGoogleAuth: true 
                            }),
                        });
                        
                        const updateData = await updateResponse.json();
                        console.log('Password update response:', updateData);
                        
                        if (updateResponse.ok) {
                            // Try login again with updated password
                            console.log('Retrying login with updated password...');
                            response = await fetch('/api/auth/login', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                    email: decoded.email, 
                                    password: 'google_oauth_' + decoded.sub 
                                }),
                            });
                            data = await response.json();
                            console.log('Retry login response:', data);
                        }
                    } else {
                        console.log('User does not exist, checking registration settings...');
                        // User doesn't exist - check if registration is enabled before creating account
                        const settingsResponse = await fetch('/api/settings');
                        const settingsData = await settingsResponse.json();
                        
                        const registrationEnabled = settingsData.success && 
                            settingsData.data?.authPages?.enableRegistration !== false;

                        if (!registrationEnabled) {
                            throw new Error('Registration is currently disabled by administrator. Please contact admin to create your account.');
                        }

                        console.log('Creating new user account...');
                        // Proceed with automatic registration only if enabled
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
                        console.log('Registration response:', data);
                        isNewUser = true;
                    }
                }

                console.log('Google OAuth final response:', data);

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
                    // Handle failed login/registration
                    throw new Error(data.error || 'Google authentication failed');
                }
            } else if (type === 'register') {
                // Register with Google data (skip OTP verification)
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: decoded.name,
                        email: decoded.email,
                        phone: '', // Google doesn't provide phone
                        password: 'google_oauth_' + decoded.sub,
                        isGoogleAuth: true,
                        emailVerified: true
                    }),
                });
                
                const data = await response.json();

                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Registration successful with Google! No OTP needed.',
                        timer: 1500,
                        showConfirmButton: false
                    });
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
            console.log('Google OAuth Error:', error)
            
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
        console.log('Google OAuth Error:', error)
        
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