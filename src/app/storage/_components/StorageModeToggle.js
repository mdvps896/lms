'use client'
import React from 'react'

const StorageModeToggle = ({ storageMode, setStorageMode, loading, onRefresh }) => {
    return (
        <div className="d-flex gap-2">
            <div className="btn-group" role="group">
                <button
                    type="button"
                    className={`btn ${storageMode === 'files' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setStorageMode('files')}
                >
                    <i className="fas fa-folder me-2"></i>All Files
                </button>
                <button
                    type="button"
                    className={`btn ${storageMode === 'users' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setStorageMode('users')}
                >
                    <i className="fas fa-users me-2"></i>User View
                </button>
            </div>

            {storageMode === 'files' && (
                <button
                    className="btn btn-light d-flex align-items-center gap-2"
                    onClick={onRefresh}
                    disabled={loading}
                >
                    <i className={`fas fa-sync ${loading ? 'fa-spin' : ''}`}></i>
                </button>
            )}
        </div>
    )
}

export default StorageModeToggle
