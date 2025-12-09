'use client'

import React, { useState } from 'react'
import Swal from 'sweetalert2'
import { Upload, Link } from 'feather-icons-react'

const FileUpload = ({ onUploadComplete }) => {
    const [uploading, setUploading] = useState(false)
    const [showUrlInput, setShowUrlInput] = useState(false)
    const [fileUrl, setFileUrl] = useState('')
    const [selectedFolder, setSelectedFolder] = useState('images')

    const folders = [
        { value: 'images', label: 'Images' },
        { value: 'exam-videos', label: 'Exam Videos' },
        { value: 'exam-screen-videos', label: 'Exam Screen Videos' },
        { value: 'sounds', label: 'Sounds' },
        { value: 'documents', label: 'Documents' },
        { value: 'other', label: 'Other' }
    ]

    const handleFileUpload = async (e) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploading(true)
        const formData = new FormData()

        for (let i = 0; i < files.length; i++) {
            formData.append('file', files[i])
            formData.append('folder', selectedFolder)

            try {
                const response = await fetch('/api/storage/upload', {
                    method: 'POST',
                    body: formData
                })

                const data = await response.json()
                if (!data.success) {
                    throw new Error(data.message)
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Upload Failed',
                    text: error.message || 'Failed to upload file'
                })
            }
        }

        setUploading(false)
        e.target.value = ''
        
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Files uploaded successfully',
            timer: 1500,
            showConfirmButton: false
        })

        onUploadComplete()
    }

    const handleUrlUpload = async () => {
        if (!fileUrl) {
            Swal.fire({
                icon: 'warning',
                title: 'Warning',
                text: 'Please enter a valid URL'
            })
            return
        }

        setUploading(true)
        const formData = new FormData()
        formData.append('fileUrl', fileUrl)
        formData.append('folder', selectedFolder)

        try {
            const response = await fetch('/api/storage/upload', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'File uploaded from URL successfully',
                    timer: 1500,
                    showConfirmButton: false
                })
                setFileUrl('')
                setShowUrlInput(false)
                onUploadComplete()
            } else {
                throw new Error(data.message)
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: error.message || 'Failed to upload file from URL'
            })
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="mb-4">
            <div className="d-flex flex-wrap gap-3 align-items-end">
                <div>
                    <label className="form-label">Select Folder</label>
                    <select 
                        className="form-select"
                        value={selectedFolder}
                        onChange={(e) => setSelectedFolder(e.target.value)}
                        disabled={uploading}
                    >
                        {folders.map(folder => (
                            <option key={folder.value} value={folder.value}>
                                {folder.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="file-upload" className="btn btn-primary">
                        <Upload size={16} className="me-2" />
                        Upload Files
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        disabled={uploading}
                        style={{ display: 'none' }}
                    />
                </div>

                <button
                    className="btn btn-outline-primary"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    disabled={uploading}
                >
                    <Link size={16} className="me-2" />
                    Add from URL
                </button>

                {uploading && (
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Uploading...</span>
                    </div>
                )}
            </div>

            {showUrlInput && (
                <div className="mt-3">
                    <div className="input-group">
                        <input
                            type="url"
                            className="form-control"
                            placeholder="Enter file URL (e.g., https://example.com/image.jpg)"
                            value={fileUrl}
                            onChange={(e) => setFileUrl(e.target.value)}
                            disabled={uploading}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleUrlUpload}
                            disabled={uploading || !fileUrl}
                        >
                            Upload
                        </button>
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => {
                                setShowUrlInput(false)
                                setFileUrl('')
                            }}
                            disabled={uploading}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default FileUpload
