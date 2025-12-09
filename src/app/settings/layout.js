'use client'
import React from 'react'
import NavigationManu from '@/components/shared/navigationMenu/NavigationMenu'
import useBootstrapUtils from '@/hooks/useBootstrapUtils'
import Header from '@/components/shared/header/Header'
import { usePathname } from 'next/navigation'
import ProtectedRoute from '@/components/shared/ProtectedRoute'

const layout = ({ children }) => {
    const pathName = usePathname()
    useBootstrapUtils(pathName)

    return (
        <ProtectedRoute>
            <Header />
            <NavigationManu />
            <main className="nxl-container apps-container">
                <div className="nxl-content without-header nxl-full-content">
                    <div className='main-content d-flex'>
                        {/* SettingSidebar hidden for settings page */}
                        {children}
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    )
}

export default layout