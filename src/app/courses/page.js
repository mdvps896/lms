'use client'

import React from 'react'
import CourseList from '@/components/courses/CourseList'
import Header from '@/components/shared/header/Header'
import NavigationManu from '@/components/shared/navigationMenu/NavigationMenu'
import SupportDetails from '@/components/supportDetails'
import ProtectedRoute from '@/components/shared/ProtectedRoute'

const CoursesPage = () => {
    return (
        <ProtectedRoute allowedRoles={['admin', 'teacher']}>
            <Header />
            <NavigationManu />
            <main className="nxl-container">
                <div className="nxl-content">
                    <div className="page-header">
                        <div className="page-header-left d-flex align-items-center">
                            <div className="page-header-title">
                                <h5 className="m-b-10">Course Management</h5>
                            </div>
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><a href="/">Home</a></li>
                                <li className="breadcrumb-item">Courses</li>
                            </ul>
                        </div>
                        <div className="page-header-right ms-auto">
                            <div className="page-header-right-items">
                                <div className="d-flex d-md-none">
                                    <a href="#" className="page-header-right-close-toggle">
                                        <i className="feather-arrow-left me-2"></i>
                                        <span>Back</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="main-content">
                        <div className="row">
                            <div className="col-lg-12">
                                <CourseList />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <SupportDetails />
        </ProtectedRoute>
    )
}

export default CoursesPage
