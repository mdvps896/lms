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
    
    useEffect(() => {
        // Fallback: Fetch settings if not available from context
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                const data = await response.json();
                if (data.success) {
                    setLocalSettings(data.data);
                    if (data.data?.themeDesign?.uiCustomization) {
                        applyThemeColors(data.data.themeDesign.uiCustomization);
                    }
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                setLoadingSettings(false);
            }
        };
        
        if (!settings && !localSettings) {
            fetchSettings();
        } else {
            setLoadingSettings(false);
        }
    }, [settings, localSettings]);
    
    // Get logos from settings context or local settings
    const currentSettings = settings || localSettings;
    const siteLogo = currentSettings?.general?.siteLogo;
    const siteSmallLogo = currentSettings?.general?.siteSmallLogo;
    
    return (
        <nav className={`nxl-navigation ${navigationOpen ? "mob-navigation-active" : ""}`}>
            <div className="navbar-wrapper">
                <div className="m-header">
                    <Link href="/" className="b-brand">
                        {/* Dynamic Logo */}
                        {siteLogo && (
                            <Image 
                                width={130} 
                                height={55} 
                                src={siteLogo} 
                                alt="logo" 
                                className="logo logo-lg" 
                            />
                        )}
                        {siteSmallLogo && (
                            <Image 
                                width={33} 
                                height={40} 
                                src={siteSmallLogo} 
                                alt="logo" 
                                className="logo logo-sm" 
                            />
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