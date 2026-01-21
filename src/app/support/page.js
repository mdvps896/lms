'use client'

import React from 'react'
import Header from '@/components/shared/header/Header'
import NavigationManu from '@/components/shared/navigationMenu/NavigationMenu'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import AdminSupportChat from '@/components/support/AdminSupportChat'

const SupportPage = () => {
    return (
        <ProtectedRoute>
            <Header />
            <NavigationManu />
            <main className="nxl-container">
                <div className="nxl-content">
                    {/* Breadcrumb Removed */}

                    <div className="main-content">
                        <div className="row">
                            <div className="col-lg-12">
                                <AdminSupportChat />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    )
}

export default SupportPage
