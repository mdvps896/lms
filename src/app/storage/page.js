'use client'
import React, { useState } from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Header from '@/components/shared/header/Header'
import NavigationManu from '@/components/shared/navigationMenu/NavigationMenu'
import SupportDetails from '@/components/supportDetails'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import UserMediaGrid from '@/components/storage/UserMediaGrid'
import useStorageData from './_components/useStorageData'
import DeletingOverlay from './_components/DeletingOverlay'
import StorageModeToggle from './_components/StorageModeToggle'
import FilesPanel from './_components/FilesPanel'

const StoragePage = () => {
    const [storageMode, setStorageMode] = useState('files') // 'files' or 'users'
    const data = useStorageData(storageMode)
    const { loading, deleting, fetchFiles } = data

    return (
        <ProtectedRoute>
            <Header />
            <NavigationManu />
            <main className="nxl-container">
                <DeletingOverlay deleting={deleting} />
                <div className="nxl-content">
                    <PageHeader
                        title="Media & Storage"
                        breadcrumb={[
                            { name: 'Dashboard', path: '/' },
                            { name: 'Media & Storage' }
                        ]}
                    >
                        <StorageModeToggle
                            storageMode={storageMode}
                            setStorageMode={setStorageMode}
                            loading={loading}
                            onRefresh={fetchFiles}
                        />
                    </PageHeader>

                    {storageMode === 'files' ? (
                        <FilesPanel data={data} />
                    ) : (
                        <UserMediaGrid />
                    )}
                </div>
            </main>
            <SupportDetails />
        </ProtectedRoute>
    )
}

export default StoragePage
