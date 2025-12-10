'use client'
import React, { useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import PerfectScrollbar from "react-perfect-scrollbar";
import Menus from './Menus';
import { NavigationContext } from '@/contentApi/navigationProvider';
import { useSettings } from '@/contexts/SettingsContext';

const NavigationManu = () => {
    const { navigationOpen, setNavigationOpen } = useContext(NavigationContext)
    const { settings } = useSettings();
    const pathName = usePathname()
    const [localSettings, setLocalSettings] = useState(null);
    const [loadingSettings, setLoadingSettings] = useState(true);
    
    useEffect(() => {
        setNavigationOpen(false)
    }, [pathName])
    
    // Apply theme colors from settings context
    useEffect(() => {
        if (settings?.themeDesign?.uiCustomization) {
            applyThemeColors(settings.themeDesign.uiCustomization);
        }
    }, [settings]);
    
    const applyThemeColors = (uiCustomization) => {
        const root = document.documentElement;
        root.style.setProperty('--sidebar-bg-color', uiCustomization.sidebarBackground);
        root.style.setProperty('--sidebar-text-color', uiCustomization.sidebarTextColor);
        root.style.setProperty('--sidebar-hover-color', uiCustomization.sidebarHoverColor);
        root.style.setProperty('--active-menu-color', uiCustomization.activeMenuColor);
        root.style.setProperty('--active-menu-text', uiCustomization.activeMenuText);
        root.style.setProperty('--primary-color', uiCustomization.primaryColor);
        root.style.setProperty('--secondary-color', uiCustomization.secondaryColor);
        root.style.setProperty('--topbar-bg-color', uiCustomization.topBarBackground);
        root.style.setProperty('--topbar-text-color', uiCustomization.topBarTextColor);
        root.style.setProperty('--button-hover-color', uiCustomization.buttonHoverColor);
    };
    
    // Force refresh settings when component mounts or when page changes
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                console.log('🔄 Fetching settings for navigation menu...');
                const response = await fetch('/api/settings', {
                    cache: 'no-cache',
                    headers: {
                        'Cache-Control': 'no-cache'
                    }
                });
                const data = await response.json();
                if (data.success) {
                    console.log('✅ Settings loaded for navigation:', data.data.general);
                    setLocalSettings(data.data);
                    if (data.data?.themeDesign?.uiCustomization) {
                        applyThemeColors(data.data.themeDesign.uiCustomization);
                    }
                } else {
                    console.error('❌ Failed to fetch settings:', data.message);
                }
            } catch (error) {
                console.error('❌ Error fetching settings:', error);
            } finally {
                setLoadingSettings(false);
            }
        };
        
        // Always fetch settings to ensure latest data
        fetchSettings();
    }, [pathName]); // Refresh when path changes
    
    // Get logos and dimensions from settings context or local settings
    const currentSettings = settings || localSettings;
    const siteLogo = currentSettings?.general?.siteLogo;
    const siteSmallLogo = currentSettings?.general?.siteSmallLogo;
    const siteLogoWidth = currentSettings?.general?.siteLogoWidth || 150;
    const siteLogoHeight = currentSettings?.general?.siteLogoHeight || 50;
    const siteSmallLogoWidth = currentSettings?.general?.siteSmallLogoWidth || 40;
    const siteSmallLogoHeight = currentSettings?.general?.siteSmallLogoHeight || 40;
    
    // Debug logging
    console.log('🖼️ Navigation Logo Debug:', {
        hasSettings: !!currentSettings,
        hasGeneral: !!currentSettings?.general,
        siteLogo,
        siteSmallLogo,
        dimensions: { siteLogoWidth, siteLogoHeight, siteSmallLogoWidth, siteSmallLogoHeight }
    });
    
    // Normalize logo paths to ensure they start with /
    const normalizedSiteLogo = siteLogo?.startsWith('http') ? siteLogo : 
        siteLogo?.startsWith('/') ? siteLogo : 
        siteLogo ? '/' + siteLogo : '/images/logo-full.png';
        
    const normalizedSiteSmallLogo = siteSmallLogo?.startsWith('http') ? siteSmallLogo :
        siteSmallLogo?.startsWith('/') ? siteSmallLogo : 
        siteSmallLogo ? '/' + siteSmallLogo : '/images/logo-abbr.png';
    
    return (
        <nav className={`nxl-navigation ${navigationOpen ? "mob-navigation-active" : ""}`}>
            <div className="navbar-wrapper">
                <div className="m-header">
                    <Link href="/" className="b-brand">
                        {/* Dynamic Logo with Dynamic Dimensions */}
                        {!loadingSettings ? (
                            <>
                                <Image 
                                    width={siteLogoWidth} 
                                    height={siteLogoHeight} 
                                    src={normalizedSiteLogo} 
                                    alt="Site Logo" 
                                    className="logo logo-lg" 
                                    style={{
                                        maxWidth: '100%',
                                        height: 'auto',
                                        objectFit: 'contain'
                                    }}
                                    onError={(e) => {
                                        console.log('🚫 Logo failed to load, using fallback');
                                        e.currentTarget.src = '/images/logo-full.png';
                                    }}
                                    priority
                                />
                                <Image 
                                    width={siteSmallLogoWidth} 
                                    height={siteSmallLogoHeight} 
                                    src={normalizedSiteSmallLogo} 
                                    alt="Small Logo" 
                                    className="logo logo-sm" 
                                    style={{
                                        maxWidth: '100%',
                                        height: 'auto',
                                        objectFit: 'contain'
                                    }}
                                    onError={(e) => {
                                        console.log('🚫 Small logo failed to load, using fallback');
                                        e.currentTarget.src = '/images/logo-abbr.png';
                                    }}
                                    priority
                                />
                            </>
                        ) : (
                            // Loading fallback
                            <>
                                <div className="logo logo-lg bg-light rounded" style={{width: '150px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    <span className="text-muted">Loading...</span>
                                </div>
                                <div className="logo logo-sm bg-light rounded" style={{width: '40px', height: '40px'}}></div>
                            </>
                        )}
                    </Link>
                </div>

                <div className={`navbar-content`}>
                    <PerfectScrollbar>
                        <ul className="nxl-navbar">
                            <li className="nxl-item nxl-caption">
                                <label>Navigation</label>
                            </li>
                            <Menus />
                        </ul>
                        <div style={{ height: "18px" }}></div>
                    </PerfectScrollbar>
                </div>
            </div>
            <div onClick={() => setNavigationOpen(false)} className={`${navigationOpen ? "nxl-menu-overlay" : ""}`}></div>
        </nav>
    )
}

export default NavigationManu