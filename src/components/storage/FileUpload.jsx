'use client'

import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { Upload, Link, Cloud, HardDrive } from 'feather-icons-react'

const FileUpload = ({ onUploadComplete }) => {
    const [uploading, setUploading] = useState(false)
    const [showUrlInput, setShowUrlInput] = useState(false)
    const [fileUrl, setFileUrl] = useState('')
    const [selectedFolder, setSelectedFolder] = useState('images')
    const [uploadProgress, setUploadProgress] = useState({ show: false, fileName: '', progress: 0 })

    const folders = [
        { value: 'images', label: 'Images' },
        { value: 'videos', label: 'Videos' },
        { value: 'exam-recordings', label: 'Exam Recordings' },
        { value: 'sounds', label: 'Sounds' },
        { value: 'documents', label: 'Documents' },
        { value: 'other', label: 'Other' }
    ]

    const handleFileUpload = async (e) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        // Files will be uploaded to local storage

        setUploading(true)
        let successCount = 0
        let errorCount = 0
        const errors = []

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const fileSize = file.size
            const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2)

            // Show progress bar
            setUploadProgress({
                show: true,
                fileName: file.name,
                progress: 0,
            })

            try {
                // Large files go up as one raw binary body (no splitting, no
                // chunk files on disk); small files use the plain form upload.
                if (fileSize > 20 * 1024 * 1024) {
                    let result = await uploadDirectly(file, selectedFolder)
                    if (!result.success) {
                        result = await uploadSimple(file, selectedFolder)
                    }
                    if (result.success) {
                        successCount++;
                    } else {
                        errorCount++;
                        errors.push(`${file.name}: ${result.message}`);
                    }
                } else {
                    // Regular upload for smaller files
                    // Show progress for regular upload
                    setUploadProgress(prev => ({ ...prev, progress: 50 }))

                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('folder', selectedFolder)

                    const response = await fetch('/api/storage/upload', {
                        method: 'POST',
                        body: formData
                    })

                    const data = await response.json()
                    if (data.success) {
                        successCount++;
                        setUploadProgress(prev => ({ ...prev, progress: 100 }));
                    } else {
                        errorCount++;
                        errors.push(`${file.name}: ${data.message}`);
                    }
                }
            } catch (error) {
                errorCount++;
                errors.push(`${file.name}: ${error.message || 'Upload failed'}`);
                console.error('❌ Upload error:', error);
            }
        }

        setUploading(false)
        setUploadProgress({ show: false, fileName: '', progress: 0 })
        e.target.value = ''

        if (errorCount === 0) {
            Swal.fire({
                icon: 'success',
                title: '🚀 Upload Successful - No Size Limits!',
                text: `${successCount} file(s) uploaded to local storage successfully!`,
                timer: 3000,
                showConfirmButton: false
            })
        } else if (successCount > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Partial Upload Success',
                html: `<p>${successCount} files uploaded successfully, ${errorCount} failed.</p><br/><small>${errors.join('<br/>')}</small>`
            })
        } else {
            // Check if all errors are 413 (file too large)
            const has413Errors = errors.some(error => error.includes('413'))
            if (has413Errors) {
                Swal.fire({
                    icon: 'error',
                    title: 'File Size Error',
                    html: `
                        <p>Files are too large for the server to process.</p>
                        <br/>
                        <p><strong>Solutions:</strong></p>
                        <ul style="text-align: left; font-size: 0.9em;">
                            <li>Try uploading files smaller than 100MB</li>
                            <li>Compress large files before uploading</li>
                            <li>Split archives into smaller parts</li>
                        </ul>
                        <br/>
                        <small>${errors.join('<br/>')}</small>
                    `
                })
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Upload Failed',
                    html: `<p>All uploads failed:</p><br/><small>${errors.join('<br/>')}</small>`
                })
            }
        }

        onUploadComplete()
    }

    // Simple upload method for fallback
    const uploadSimple = async (file, folder) => {
        // Set progress to indeterminate for simple upload
        setUploadProgress(prev => ({ ...prev, progress: 75 }))

        try {
            // Read file as array buffer
            const arrayBuffer = await file.arrayBuffer()

            const response = await fetch('/api/storage/simple-upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'x-filename': file.name,
                    'x-folder': folder,
                    'x-mime-type': file.type || 'application/octet-stream'
                },
                body: arrayBuffer
            })

            const result = await response.json()

            if (result.success) {
                setUploadProgress(prev => ({ ...prev, progress: 100 }))
                return result
            } else {
                console.error('❌ Simple upload failed:', result.message)
                return result
            }

        } catch (error) {
            console.error('💥 Simple upload error:', error)
            return { success: false, message: error.message }
        }
    }

    // Binary upload method that sends raw file data with headers
    const uploadDirectly = async (file, folder) => {
        // Set progress to indeterminate for direct upload
        setUploadProgress(prev => ({ ...prev, progress: 50 }))

        try {
            // Read file as array buffer
            const arrayBuffer = await file.arrayBuffer()

            const response = await fetch('/api/storage/binary-upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'x-filename': file.name,
                    'x-folder': folder,
                    'x-mime-type': file.type || 'application/octet-stream'
                },
                body: arrayBuffer
            })

            const result = await response.json()

            if (result.success) {
                setUploadProgress(prev => ({ ...prev, progress: 100 }))
                return result
            } else {
                console.error('❌ Binary upload failed:', result.message)
                return result
            }

        } catch (error) {
            console.error('💥 Binary upload error:', error)
            return { success: false, message: error.message }
        }
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
                    title: 'Upload Successful',
                    html: `File uploaded from URL to local storage successfully!<br/><small>Stored in: ${selectedFolder}</small>`,
                    timer: 2000,
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
            {/* Storage Status Indicator */}


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

            {/* Upload Progress Bar */}
            {uploadProgress.show && (
                <div className="mt-3">
                    <div className="card upload-progress-card">
                        <div className="card-body p-3">
                            <h6 className="card-title mb-2 d-flex align-items-center">
                                <i className="fas fa-cloud-upload-alt me-2 text-primary"></i>
                                <span className="text-truncate">Uploading: {uploadProgress.fileName}</span>
                            </h6>

                            <div className="upload-progress-bar mb-2">
                                <div
                                    className="upload-progress-fill"
                                    style={{ width: `${uploadProgress.progress}%` }}
                                    role="progressbar"
                                    aria-valuenow={uploadProgress.progress}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                ></div>
                            </div>

                            <div className="d-flex justify-content-between align-items-center">
                                <div className="upload-chunk-indicator">
                                    <i className="fas fa-rocket"></i>
                                    <span>{uploadProgress.progress < 100 ? 'Processing...' : 'Complete!'}</span>
                                </div>
                                <div className="text-primary fw-bold">
                                    {uploadProgress.progress}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
