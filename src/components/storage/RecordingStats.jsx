'use client'

import React from 'react'
import { Video, Camera, Monitor, Cloud, HardDrive } from 'feather-icons-react'

const RecordingStats = ({ files }) => {
    const recordings = files.filter(file => file.category === 'exam-recording')
    
    const cameraRecordings = recordings.filter(r => r.recordingType === 'camera')
    const screenRecordings = recordings.filter(r => r.recordingType === 'screen')
    const cloudinaryRecordings = recordings.filter(r => r.source === 'cloudinary')
    const localRecordings = recordings.filter(r => r.source === 'local')
    
    const totalSize = recordings.reduce((sum, file) => sum + (file.size || 0), 0)
    
    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }
    
    if (recordings.length === 0) {
        return null
    }

    return (
        <div className="alert alert-info" role="alert">
            <div className="d-flex align-items-center mb-3">
                <Video className="me-2" size={20} />
                <h6 className="mb-0">Exam Recordings Overview</h6>
            </div>
            
            <div className="row g-3">
                <div className="col-md-2 col-sm-6">
                    <div className="text-center">
                        <Camera className="mb-2 text-primary" size={24} />
                        <div className="fw-bold">{cameraRecordings.length}</div>
                        <small className="text-muted">Camera</small>
                    </div>
                </div>
                
                <div className="col-md-2 col-sm-6">
                    <div className="text-center">
                        <Monitor className="mb-2 text-success" size={24} />
                        <div className="fw-bold">{screenRecordings.length}</div>
                        <small className="text-muted">Screen</small>
                    </div>
                </div>
                
                <div className="col-md-2 col-sm-6">
                    <div className="text-center">
                        <Cloud className="mb-2 text-info" size={24} />
                        <div className="fw-bold">{cloudinaryRecordings.length}</div>
                        <small className="text-muted">Cloud</small>
                    </div>
                </div>
                
                <div className="col-md-2 col-sm-6">
                    <div className="text-center">
                        <HardDrive className="mb-2 text-warning" size={24} />
                        <div className="fw-bold">{localRecordings.length}</div>
                        <small className="text-muted">Local</small>
                    </div>
                </div>
                
                <div className="col-md-2 col-sm-6">
                    <div className="text-center">
                        <Video className="mb-2 text-danger" size={24} />
                        <div className="fw-bold">{recordings.length}</div>
                        <small className="text-muted">Total</small>
                    </div>
                </div>
                
                <div className="col-md-2 col-sm-6">
                    <div className="text-center">
                        <div className="mb-2">💾</div>
                        <div className="fw-bold">{formatSize(totalSize)}</div>
                        <small className="text-muted">Size</small>
                    </div>
                </div>
            </div>
            
            <hr className="my-3" />
            
            <div className="row">
                <div className="col-md-6">
                    <small className="text-muted">
                        <strong>Latest Recording:</strong> {recordings.length > 0 ? 
                            new Date(Math.max(...recordings.map(r => new Date(r.createdAt)))).toLocaleDateString() : 'None'
                        }
                    </small>
                </div>
                <div className="col-md-6">
                    <small className="text-muted">
                        <strong>Storage:</strong> {cloudinaryRecordings.length > 0 ? 'Using Cloudinary' : 'Local Storage Only'}
                    </small>
                </div>
            </div>
        </div>
    )
}

export default RecordingStats