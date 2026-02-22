'use client';
import React from 'react';
import NewsTickerSettings from '@/components/settings/NewsTickerSettings';
import Header from '@/components/shared/header/Header';
import NavigationManu from '@/components/shared/navigationMenu/NavigationMenu';
import SupportDetails from '@/components/supportDetails';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

const NewsTickerPage = () => {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <Header />
            <NavigationManu />
            <main className="nxl-container">
                <div className="nxl-content">
                    <div className="page-header">
                        <div className="page-header-left d-flex align-items-center">
                            <div className="page-header-title">
                                <h5 className="m-b-10">News Ticker Management</h5>
                            </div>
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><a href="/">Home</a></li>
                                <li className="breadcrumb-item">News Ticker</li>
                            </ul>
                        </div>
                    </div>

                    <div className="main-content">
                        <div className="row">
                            <div className="col-lg-12">
                                <NewsTickerSettings />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <SupportDetails />
        </ProtectedRoute>
    );
};

export default NewsTickerPage;
