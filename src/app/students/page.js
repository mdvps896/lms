'use client'

import React from 'react'
import StudentList from '@/components/students/StudentList'
import DeletedStudentsModal from '@/components/students/DeletedStudentsModal'
import Header from '@/components/shared/header/Header'
import NavigationManu from '@/components/shared/navigationMenu/NavigationMenu'
import SupportDetails from '@/components/supportDetails'
import ProtectedRoute from '@/components/shared/ProtectedRoute'

const StudentsPage = () => {
    const [showDeletedModal, setShowDeletedModal] = React.useState(false);
    const [refreshKey, setRefreshKey] = React.useState(0); // To trigger list refresh
    const [deletedCount, setDeletedCount] = React.useState(0);

    React.useEffect(() => {
        fetchDeletedCount();
    }, [refreshKey]);

    const fetchDeletedCount = async () => {
        try {
            const res = await fetch('/api/users/deleted?count=true');
            const data = await res.json();
            if (data.success) {
                setDeletedCount(data.count);
            }
        } catch (error) {
            console.error('Error fetching deleted count:', error);
        }
    };

    return (
        <ProtectedRoute>
            <Header />
            <NavigationManu />
            <main className="nxl-container">
                <div className="nxl-content">
                    <div className="page-header">
                        <div className="page-header-left d-flex align-items-center">
                            <div className="page-header-title">
                                <h5 className="m-b-10">Students Management</h5>
                            </div>
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><a href="/">Home</a></li>
                                <li className="breadcrumb-item">Students</li>
                            </ul>
                        </div>
                        <div className="page-header-right ms-auto">
                            <div className="page-header-right-items">
                                <button
                                    className="btn btn-danger d-flex align-items-center gap-2 position-relative"
                                    onClick={() => setShowDeletedModal(true)}
                                >
                                    <i className="feather-trash-2"></i>
                                    <span>Recycle Bin</span>
                                    {deletedCount > 0 && (
                                        <span className="badge bg-white text-danger rounded-pill ms-1" style={{ fontSize: '10px' }}>
                                            {deletedCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="main-content">
                        <div className="row">
                            <div className="col-lg-12">
                                <StudentList
                                    key={refreshKey}
                                    onDelete={fetchDeletedCount}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <SupportDetails />
            <DeletedStudentsModal
                isOpen={showDeletedModal}
                onClose={() => setShowDeletedModal(false)}
                onRestoreSuccess={() => setRefreshKey(prev => prev + 1)}
            />
        </ProtectedRoute>
    )
}

export default StudentsPage
