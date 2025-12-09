'use client'

import LoginForm from '@/components/authentication/LoginForm'
import Image from 'next/image'
import Head from 'next/head'
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

const AuthLogo = () => {
    const [logo, setLogo] = useState(null);
    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => data.success && setLogo(data.data.general?.siteLogo))
            .catch(console.error);
    }, []);
    return logo ? <div className="wd-150 mb-5"><img src={logo} alt="logo" className="img-fluid" style={{maxHeight: '80px', width: 'auto'}} /></div> : null;
}

const Page = () => {
    const { isAuthenticated, loading } = useAuth()
    const router = useRouter()
    const [showLogin, setShowLogin] = useState(false)
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSettings(data.data);
                    // Set dynamic favicon
                    if (data.data.general?.siteFavIcon) {
                        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
                        link.type = 'image/x-icon';
                        link.rel = 'shortcut icon';
                        link.href = data.data.general.siteFavIcon;
                        document.getElementsByTagName('head')[0].appendChild(link);
                    }
                }
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!loading && isAuthenticated) {
            router.push('/')
        }
    }, [isAuthenticated, loading, router])

    useEffect(() => {
        // Set a timeout to show login form even if loading takes too long
        const timer = setTimeout(() => {
            setShowLogin(true)
        }, 300) // Show login after 300ms maximum

        return () => clearTimeout(timer)
    }, [])

    // Show login form if not authenticated or if timeout reached
    if ((!loading && !isAuthenticated) || showLogin) {
        return (
            <main className="auth-cover-wrapper">
                <div className="auth-cover-content-inner">
                    <div className="auth-cover-content-wrapper">
                        <div className="auth-img">
                            <Image 
                                width={600} 
                                height={600} 
                                sizes='100vw' 
                                src={settings?.authPages?.loginBgImage || '/images/auth/auth-cover-login-bg.svg'} 
                                alt="img" 
                                className="img-fluid" 
                                priority
                            />
                        </div>
                    </div>
                </div>
                <div className="auth-cover-sidebar-inner">
                    <div className="auth-cover-card-wrapper">
                        <div className="auth-cover-card p-sm-5">
                            <AuthLogo />
                            <LoginForm 
                                registerPath="/authentication/register" 
                                resetPath="/authentication/reset" 
                                enableRegistration={settings?.authPages?.enableRegistration !== false}
                            />
                        </div>
                    </div>
                </div>
            </main>
        )
    }

    // Show a simpler loading state
    if (loading && !showLogin) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted">Checking authentication...</p>
                </div>
            </div>
        )
    }

    // If authenticated, show nothing (will redirect)
    return null
}

export default Page