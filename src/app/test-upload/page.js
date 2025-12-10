'use client'

import React, { useState } from 'react'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function UploadTestPage() {
    const [testResults, setTestResults] = useState([])
    const [testing, setTesting] = useState(false)

    const runUploadTest = async (testType, description) => {
        setTesting(true)
        const startTime = Date.now()
        
        try {
            let result
            
            switch (testType) {
                case 'small-file':
                    result = await testSmallFileUpload()
                    break
                case 'medium-file':
                    result = await testMediumFileUpload()
                    break
                case 'large-file':
                    result = await testLargeFileUpload()
                    break
                case 'video-upload':
                    result = await testVideoUpload()
                    break
                default:
                    result = { success: false, message: 'Unknown test type' }
            }
            
            const duration = Date.now() - startTime
            const testResult = {
                type: testType,
                description,
                success: result.success,
                message: result.message,
                duration: `${duration}ms`,
                timestamp: new Date().toLocaleTimeString()
            }
            
            setTestResults(prev => [testResult, ...prev])
        } catch (error) {
            const duration = Date.now() - startTime
            const testResult = {
                type: testType,
                description,
                success: false,
                message: error.message,
                duration: `${duration}ms`,
                timestamp: new Date().toLocaleTimeString()
            }
            
            setTestResults(prev => [testResult, ...prev])
        }
        
        setTesting(false)
    }

    const testSmallFileUpload = async () => {
        // Create a small test file (1KB)
        const testData = 'A'.repeat(1024) // 1KB file
        const blob = new Blob([testData], { type: 'text/plain' })
        const file = new File([blob], 'test-small-1kb.txt', { type: 'text/plain' })
        
        return await uploadFile(file)
    }

    const testMediumFileUpload = async () => {
        // Create a medium test file (5MB)
        const testData = 'B'.repeat(5 * 1024 * 1024) // 5MB file
        const blob = new Blob([testData], { type: 'text/plain' })
        const file = new File([blob], 'test-medium-5mb.txt', { type: 'text/plain' })
        
        return await uploadFile(file)
    }

    const testLargeFileUpload = async () => {
        // Create a large test file (50MB)
        const testData = 'C'.repeat(50 * 1024 * 1024) // 50MB file
        const blob = new Blob([testData], { type: 'text/plain' })
        const file = new File([blob], 'test-large-50mb.txt', { type: 'text/plain' })
        
        return await uploadFile(file)
    }

    const testVideoUpload = async () => {
        // Test video upload endpoint
        const response = await fetch('/api/test/upload-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                testType: 'video',
                fileName: 'test-video-upload.webm'
            })
        })
        
        return await response.json()
    }

    const uploadFile = async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'test-uploads')
        
        const fileSize = file.size
        
        // Use chunked upload for files larger than 10MB
        if (fileSize > 10 * 1024 * 1024) {
            return await uploadFileChunked(file)
        } else {
            const response = await fetch('/api/storage/upload', {
                method: 'POST',
                body: formData
            })
            
            return await response.json()
        }
    }

    const uploadFileChunked = async (file) => {
        const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks for testing
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
        const fileId = `test_${Date.now()}`
        
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const start = chunkIndex * CHUNK_SIZE
            const end = Math.min(start + CHUNK_SIZE, file.size)
            const chunk = file.slice(start, end)
            
            const formData = new FormData()
            formData.append('file', new File([chunk], file.name, { type: file.type }))
            formData.append('folder', 'test-uploads')
            formData.append('chunkIndex', chunkIndex.toString())
            formData.append('totalChunks', totalChunks.toString())
            formData.append('fileName', file.name)
            formData.append('fileId', fileId)
            
            const response = await fetch('/api/storage/chunked-upload', {
                method: 'POST',
                body: formData
            })
            
            const result = await response.json()
            
            if (!result.success) {
                return result
            }
            
            // If this was the last chunk, return the final result
            if (chunkIndex === totalChunks - 1) {
                return result
            }
        }
        
        return { success: false, message: 'Unexpected chunked upload end' }
    }

    return (
        <div className="container-fluid px-4 py-3">
            <div className="row">
                <div className="col-12">
                    <Card>
                        <CardHeader>
                            <CardTitle>🚀 Enhanced Upload System Test Suite</CardTitle>
                            <p className="text-muted">Test the new no-limit upload capabilities</p>
                        </CardHeader>
                        <CardBody>
                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <h6>📁 File Size Tests</h6>
                                    <div className="d-flex flex-column gap-2">
                                        <Button
                                            onClick={() => runUploadTest('small-file', 'Small File (1KB) - Regular Upload')}
                                            disabled={testing}
                                            className="btn btn-outline-primary btn-sm"
                                        >
                                            Test Small File (1KB)
                                        </Button>
                                        
                                        <Button
                                            onClick={() => runUploadTest('medium-file', 'Medium File (5MB) - Regular Upload')}
                                            disabled={testing}
                                            className="btn btn-outline-warning btn-sm"
                                        >
                                            Test Medium File (5MB)
                                        </Button>
                                        
                                        <Button
                                            onClick={() => runUploadTest('large-file', 'Large File (50MB) - Chunked Upload')}
                                            disabled={testing}
                                            className="btn btn-outline-danger btn-sm"
                                        >
                                            Test Large File (50MB)
                                        </Button>
                                    </div>
                                </div>
                                
                                <div className="col-md-6">
                                    <h6>🎥 Video Upload Tests</h6>
                                    <div className="d-flex flex-column gap-2">
                                        <Button
                                            onClick={() => runUploadTest('video-upload', 'Video Upload - Enhanced System')}
                                            disabled={testing}
                                            className="btn btn-outline-success btn-sm"
                                        >
                                            Test Video Upload
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {testing && (
                                <div className="alert alert-info">
                                    <div className="d-flex align-items-center">
                                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                        <span>Running upload test...</span>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4">
                                <h6>📊 Test Results</h6>
                                {testResults.length === 0 ? (
                                    <p className="text-muted">No tests run yet. Click the buttons above to start testing.</p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-striped">
                                            <thead>
                                                <tr>
                                                    <th>Time</th>
                                                    <th>Test</th>
                                                    <th>Status</th>
                                                    <th>Duration</th>
                                                    <th>Message</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {testResults.map((result, index) => (
                                                    <tr key={index}>
                                                        <td><small>{result.timestamp}</small></td>
                                                        <td>
                                                            <small>{result.description}</small>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${result.success ? 'bg-success' : 'bg-danger'}`}>
                                                                {result.success ? '✅ Success' : '❌ Failed'}
                                                            </span>
                                                        </td>
                                                        <td><small>{result.duration}</small></td>
                                                        <td><small>{result.message}</small></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 p-3 bg-light rounded">
                                <h6>🎯 Enhanced Upload Features</h6>
                                <ul className="mb-0">
                                    <li><strong>No Size Limits:</strong> Upload files of any size (100MB, 500MB, 1GB+)</li>
                                    <li><strong>Smart Chunking:</strong> Large files automatically split into manageable chunks</li>
                                    <li><strong>Image Compression:</strong> Images 8MB automatically optimized</li>
                                    <li><strong>Video Optimization:</strong> Videos compressed using Cloudinary</li>
                                    <li><strong>Fallback Strategies:</strong> Multiple upload methods for maximum success</li>
                                    <li><strong>Progress Tracking:</strong> Real-time upload progress for large files</li>
                                </ul>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    )
}