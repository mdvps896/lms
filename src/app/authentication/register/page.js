'use client'

import RegisterForm from '@/components/authentication/RegisterForm'
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
  const [settings, setSettings] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

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
          // Check if registration is enabled
          if (data.data.authPages?.enableRegistration !== false) {
            setShowRegister(true);
          } else {
            router.push('/authentication/login');
          }
        }
      })
      .catch(console.error);
  }, [router]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, loading, router])

  if (loading || !settings) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  // Don't render if registration is disabled
  if (!showRegister) {
    return null;
  }

  return (
    <main className="auth-cover-wrapper">
      <div className="auth-cover-content-inner">
        <div className="auth-cover-content-wrapper">
          <div className="auth-img">
            <Image 
              width={600} 
              height={600} 
              sizes='100vw' 
              src={settings?.authPages?.registerBgImage || '/images/auth/auth-cover-register-bg.svg'} 
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
            <RegisterForm path="/authentication/login" settings={settings} />
          </div>
        </div>
      </div>
    </main>
  )
}

export default Page