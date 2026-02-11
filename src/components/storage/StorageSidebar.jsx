'use client'

import React from 'react'
import { Grid, Image, Video, Music, FileText, File, MoreHorizontal, HardDrive, Camera } from 'feather-icons-react'

const StorageSidebar = ({ filters, setFilters, totalFiles, storageStatus }) => {
  const fileTypes = [
    { value: 'all', label: 'All Files', icon: Grid },
    { value: 'image', label: 'Images', icon: Image },
    { value: 'video', label: 'Videos', icon: Video },
    { value: 'audio', label: 'Audio', icon: Music },
    { value: 'pdf', label: 'PDF', icon: FileText },
    { value: 'document', label: 'Documents', icon: File },
    { value: 'exam-recording', label: 'Exam Recordings', icon: Video },
    { value: 'free-material', label: 'Free Materials', icon: Camera },
    { value: 'other', label: 'Other', icon: MoreHorizontal }
  ]

  const handleTypeFilter = (type) => {
    setFilters({ ...filters, type })
  }

  return (
    <div className="card" style={{ position: 'sticky', top: '100px' }}>
      <div className="card-body p-0">
        <div className="p-4 border-bottom">
          <h5 className="mb-0 d-flex align-items-center">
            <HardDrive className="me-2 text-primary" size={20} />
            My Storage
          </h5>
        </div>

        {storageStatus && (
          <div className="p-4 border-bottom bg-light">
            <h6 className="text-uppercase small fw-bold text-muted mb-3">Total Storage Used</h6>
            <div className="d-flex justify-content-between mb-2">
              <span className="small text-muted">Usage</span>
              <span className="small fw-bold">{storageStatus.total?.sizeFormatted || '0 B'}</span>
            </div>
            <div className="d-flex justify-content-between small text-muted mb-3">
              <span>{storageStatus.total?.count || 0} Total Files</span>
            </div>
            <div className="progress" style={{ height: '6px' }}>
              <div
                className="progress-bar bg-primary"
                role="progressbar"
                style={{ width: '100%' }}
                aria-valuenow="100"
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
          </div>
        )}

        <div className="p-3">
          <p className="text-muted text-uppercase small fw-bold px-3 mb-2">File Types</p>
          <div className="list-group list-group-flush rounded-0">
            {fileTypes.map(type => {
              const IconComponent = type.icon
              const isActive = filters?.type === type.value

              return (
                <button
                  key={type.value}
                  className={`list-group-item list-group-item-action border-0 rounded-3 mb-1 d-flex align-items-center px-3 py-2 ${isActive ? 'bg-primary text-white' : 'bg-transparent text-secondary'
                    }`}
                  onClick={() => handleTypeFilter(type.value)}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <IconComponent
                    size={18}
                    className={`me-3 ${isActive ? 'text-white' : 'text-primary'}`}
                  />
                  <span>{type.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StorageSidebar