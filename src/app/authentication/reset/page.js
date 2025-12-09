'use client'

import ResetPasswordForm from '@/components/authentication/ResetPasswordForm'
import Image from 'next/image'
import Head from 'next/head'
import React, { useEffect, useState } from 'react'

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

const ResetPasswordPage = () => {
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
  
  // Get background image URL
  const getBackgroundImage = () => {
    if (settings?.authPages?.resetBgImage) {
      if (settings.authPages.resetBgImage.startsWith('http')) {
        return settings.authPages.resetBgImage;
      }
      return `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${settings.authPages.resetBgImage}`;
    }
    return '/images/auth/auth-cover-login-bg.svg';
  };

  const backgroundImageUrl = getBackgroundImage();

  return (
    <>
      <Head>
        <title>Reset Password</title>
      </Head>
      <main className="auth-cover-wrapper">
        <div className="auth-cover-content-inner">
          <div className="auth-cover-content-wrapper">
            <div className="auth-img">
              <Image 
                width={600} 
                height={600} 
                sizes='100vw' 
                src={backgroundImageUrl} 
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
              <ResetPasswordForm 
                loginPath="/authentication/login"
                settings={settings}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default ResetPasswordPage