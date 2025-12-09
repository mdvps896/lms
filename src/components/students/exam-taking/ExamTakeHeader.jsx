'use client'
import { useEffect, useState, useRef } from 'react'

const ExamTakeHeader = ({
    exam,
    timeRemaining,
    setTimeRemaining,
    onSubmit,
    attemptId,
    sessionToken
}) => {
    const [isRecording, setIsRecording] = useState(false)
    const [mediaRecorder, setMediaRecorder] = useState(null)
    const [recordedChunks, setRecordedChunks] = useState([])
    const videoRef = useRef(null)
    const streamRef = useRef(null)

    useEffect(() => {
        // Initialize camera and recording if required
        if (exam.settings?.allowCam || exam.settings?.allowMic || exam.settings?.allowScreenShare) {
            initializeRecording()
        }

        // Start timer countdown
        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    handleAutoSubmit()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => {
            clearInterval(timer)
            stopRecording()
        }
    }, [])

    const initializeRecording = async () => {
        try {
            let stream = null

            // Get camera and microphone
            if (exam.settings?.allowCam || exam.settings?.allowMic) {
                const constraints = {
                    video: exam.settings?.allowCam || false,
                    audio: exam.settings?.allowMic || false
                }

                stream = await navigator.mediaDevices.getUserMedia(constraints)

                if (videoRef.current && exam.settings?.allowCam) {
                    videoRef.current.srcObject = stream
                }
            }

            // Get screen share if required
            if (exam.settings?.allowScreenShare) {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                })

                // Combine streams if needed
                if (stream) {
                    const combinedStream = new MediaStream([
                        ...stream.getTracks(),
                        ...screenStream.getTracks()
                    ])
                    stream = combinedStream
                } else {
                    stream = screenStream
                }
            }

            if (stream) {
                streamRef.current = stream
                startRecording(stream)
            }

        } catch (error) {
            console.error('Error initializing recording:', error)
        }
    }

    const startRecording = (stream) => {
        try {
            const recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp8,opus'
            })

            const chunks = []

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data)
                }
            }

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' })
                saveRecording(blob)
            }

            recorder.start(5000) // Record in 5-second chunks
            setMediaRecorder(recorder)
            setIsRecording(true)
            setRecordedChunks(chunks)

        } catch (error) {
            console.error('Error starting recording:', error)
        }
    }

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop()
            setIsRecording(false)
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
        }
    }

    const saveRecording = async (blob) => {
        try {
            const formData = new FormData()
            formData.append('recording', blob, `exam-${attemptId}-${Date.now()}.webm`)
            formData.append('attemptId', attemptId)
            formData.append('sessionToken', sessionToken)
            formData.append('timestamp', new Date().toISOString())

            await fetch('/api/exams/save-recording', {
                method: 'POST',
                body: formData
            })
        } catch (error) {
            console.error('Error saving recording:', error)
        }
    }

    const handleAutoSubmit = () => {
        stopRecording()
        onSubmit()
    }

    const handleManualSubmit = () => {
        if (confirm('Are you sure you want to submit the exam?')) {
            stopRecording()
            onSubmit()
        }
    }

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`
    }

    const getTimeColor = () => {
        if (timeRemaining <= 300) return 'text-danger' // 5 minutes
        if (timeRemaining <= 600) return 'text-warning' // 10 minutes
        return 'text-success'
    }

    return (
        <div className="exam-header bg-primary text-white sticky-top" style={{ zIndex: 1000 }}>
            <div className="container-fluid">
                <div className="row align-items-center py-2">
                    <div className="col-md-4">
                        <div className="d-flex align-items-center">
                            <i className="feather-book me-2 text-white"></i>
                            <h5 className="mb-0 text-white">{exam.name}</h5>
                        </div>
                        <small className="text-white opacity-75">
                            {exam.subjects?.map(s => s.name).join(', ') || 'General'}
                        </small>
                    </div>

                    <div className="col-md-4 text-center">
                        <div className="fw-bold text-white" style={{ fontSize: '1.5rem' }}>
                            <i className="feather-clock me-2"></i>
                            {formatTime(timeRemaining)}
                        </div>
                        {timeRemaining <= 300 && (
                            <small className="text-warning">
                                <i className="feather-alert-triangle me-1"></i>
                                Time is running out!
                            </small>
                        )}
                    </div>

                    <div className="col-md-4 text-end">
                        <div className="d-flex justify-content-end align-items-center">
                            {/* Recording indicator */}
                            {isRecording && (
                                <div className="me-3 d-flex align-items-center">
                                    <div
                                        className="bg-danger rounded-circle me-2"
                                        style={{ width: '12px', height: '12px', animation: 'blink 1s infinite' }}
                                    ></div>
                                    <small>Recording</small>
                                </div>
                            )}

                            {/* Camera preview */}
                            {exam.settings?.allowCam && (
                                <div className="me-3">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        muted
                                        className="border border-light"
                                        style={{
                                            width: '80px',
                                            height: '60px',
                                            objectFit: 'cover',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </div>
                            )}

                            <button
                                className="btn btn-warning btn-sm"
                                onClick={handleManualSubmit}
                            >
                                <i className="feather-upload me-1"></i>
                                Submit Exam
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ExamTakeHeader