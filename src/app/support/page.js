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
                    <div className="page-header">
                        <div className="page-header-left d-flex align-items-center">
                            <div className="page-header-title">
                                <h5 className="m-b-10">Support Chat</h5>
                            </div>
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><a href="/">Home</a></li>
                                <li className="breadcrumb-item">Support</li>
                            </ul>
                        </div>
                    </div>

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
