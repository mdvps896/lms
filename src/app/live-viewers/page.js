'use client'

import React from 'react'
import Header from '@/components/shared/header/Header'
import NavigationManu from '@/components/shared/navigationMenu/NavigationMenu'
import SupportDetails from '@/components/supportDetails'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import LiveViewers from '@/components/liveViewers/LiveViewers'

const LiveViewersPage = () => {
    return (
        <ProtectedRoute>
            <Header />
            <NavigationManu />
            <main className="nxl-container">
                <div className="nxl-content">
                    <div className="page-header">
                        <div className="page-header-left d-flex align-items-center">
                            <div className="page-header-title">
                                <h5 className="m-b-10">Live Viewers</h5>
                            </div>
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><a href="/">Home</a></li>
                                <li className="breadcrumb-item"><a href="/students">Students</a></li>
                                <li className="breadcrumb-item">Live Viewers</li>
                            </ul>
                        </div>
                    </div>
                    <div className="main-content">
                        <LiveViewers />
                    </div>
                </div>
            </main>
            <SupportDetails />
        </ProtectedRoute>
    )
}

export default LiveViewersPage
