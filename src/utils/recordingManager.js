import { generateRecordingId, generateRecordingFilename } from './recordingIdGenerator.js';

/**
 * Recording Manager for Exam Proctoring
 * Handles camera, microphone, and screen recording with unique ID generation
 */

class RecordingManager {
    constructor() {
        this.cameraStream = null;
        this.screenStream = null;
        this.cameraRecorder = null;
        this.screenRecorder = null;
        this.cameraChunks = [];
        this.screenChunks = [];
        this.isRecording = false;
        this.attemptId = null;
    }

    /**
     * Request permissions and start all recordings
     */
    async startRecording(attemptId, examId, settings = {}) {
        this.attemptId = attemptId;
        this.examId = examId;
        this.settings = settings;

        try {
            // Request camera and microphone only if enabled
            if (settings.allowCam || settings.allowMic) {
                const constraints = {};
                if (settings.allowCam) {
                    constraints.video = { width: 1280, height: 720 };
                }
                if (settings.allowMic) {
                    constraints.audio = true;
                }
                this.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
            }

            // Request screen recording only if enabled
            if (settings.allowScreenShare) {
                this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        width: 1920,
                        height: 1080,
                        frameRate: 30
                    },
                    audio: true
                });
            }

            // Determine best codec
            let mimeType = 'video/webm;codecs=vp9';
            this.fileExtension = 'webm';

            if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
                mimeType = 'video/mp4;codecs=avc1';
                this.fileExtension = 'mp4';
            } else if (MediaRecorder.isTypeSupported('video/mp4')) {
                mimeType = 'video/mp4';
                this.fileExtension = 'mp4';
            } else if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm;codecs=vp8';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'video/webm';
                }
            }

            this.selectedMimeType = mimeType;

            // Start camera recording only if camera stream exists
            if (this.cameraStream) {
                this.cameraRecorder = new MediaRecorder(this.cameraStream, {
                    mimeType: mimeType,
                    videoBitsPerSecond: 1000000  // 1MB - good quality for local storage
                });

                this.cameraRecorder.ondataavailable = (event) => {
                    if (event.data && event.data.size > 0) {
                        this.cameraChunks.push(event.data);
                    }
                };

                this.cameraRecorder.onerror = (event) => {
                    console.error('❌ Camera recorder error:', event.error);
                };
            }

            // Start screen recording only if screen stream exists
            if (this.screenStream) {
                this.screenRecorder = new MediaRecorder(this.screenStream, {
                    mimeType: mimeType,
                    videoBitsPerSecond: 2000000  // 2MB - higher quality for screen content
                });

                this.screenRecorder.ondataavailable = (event) => {
                    if (event.data && event.data.size > 0) {
                        this.screenChunks.push(event.data);
                    }
                };

                this.screenRecorder.onerror = (event) => {
                    console.error('Screen recorder error:', event.error);
                };
            }

            // Start recordings WITHOUT timeslice parameter
            if (this.cameraRecorder) {
                this.cameraRecorder.start();
            }
            if (this.screenRecorder) {
                this.screenRecorder.start();
            }
            this.isRecording = true;

            // Handle stream end (user stops sharing) - only if screen recording is enabled
            if (this.screenStream && this.screenStream.getVideoTracks().length > 0) {
                this.screenStream.getVideoTracks()[0].addEventListener('ended', () => {
                    console.warn('Screen sharing stopped by user');
                    this.handleScreenShareStopped();
                });
            }

            return {
                success: true,
                cameraStream: this.cameraStream,
                screenStream: this.screenStream
            };
        } catch (error) {
            console.error('Recording permission error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Handle when user stops screen sharing
     */
    handleScreenShareStopped() {
        // Notify that screen sharing was stopped
        if (window.onScreenShareStopped) {
            window.onScreenShareStopped();
        }
    }

    /**
     * Stop all recordings and save files
     */
    async stopRecording() {
        if (!this.isRecording) {
            return null;
        }

        return new Promise((resolve) => {
            let stoppedCount = 0;
            const totalRecorders = (this.cameraRecorder ? 1 : 0) + (this.screenRecorder ? 1 : 0);

            const checkComplete = () => {
                stoppedCount++;
                if (stoppedCount === totalRecorders || totalRecorders === 0) {
                    // Wait a bit for all chunks to be collected
                    setTimeout(() => {
                        this.saveRecordings().then(resolve);
                    }, 500);
                }
            };

            // Stop camera recording
            if (this.cameraRecorder && this.cameraRecorder.state !== 'inactive') {
                this.cameraRecorder.onstop = checkComplete;
                this.cameraRecorder.stop();
            } else {
                checkComplete();
            }

            // Stop screen recording
            if (this.screenRecorder && this.screenRecorder.state !== 'inactive') {
                this.screenRecorder.onstop = checkComplete;
                this.screenRecorder.stop();
            } else {
                checkComplete();
            }

            // Stop all tracks
            if (this.cameraStream) {
                this.cameraStream.getTracks().forEach(track => track.stop());
            }
            if (this.screenStream) {
                this.screenStream.getTracks().forEach(track => track.stop());
            }

            this.isRecording = false;
        });
    }

    /**
     * Save recordings to server
     */
    async saveRecordings() {
        try {
            // Create blobs only for enabled recordings
            const blobType = this.selectedMimeType || 'video/webm';
            const cameraBlob = this.cameraChunks.length > 0 ? new Blob(this.cameraChunks, { type: blobType }) : null;
            const screenBlob = this.screenChunks.length > 0 ? new Blob(this.screenChunks, { type: blobType }) : null;

            if (cameraBlob) {
            }
            if (screenBlob) {
            }

            if (!cameraBlob && !screenBlob) {
                console.error('No recordings available!');
                return null;
            }

            // Generate unique recording IDs only for enabled recordings
            let cameraRecordingId = null;
            let screenRecordingId = null;

            if (cameraBlob && cameraBlob.size > 0) {
                cameraRecordingId = await generateRecordingId('vd', this.attemptId, this.examId);
            }
            if (screenBlob && screenBlob.size > 0) {
                screenRecordingId = await generateRecordingId('sc', this.attemptId, this.examId);
            }

            // Local Storage Upload
            const totalSize = (cameraBlob?.size || 0) + (screenBlob?.size || 0);
            // Create form data with all recordings and unique IDs
            const formData = new FormData();
            formData.append('attemptId', this.attemptId);
            formData.append('examId', this.examId);

            const extension = this.fileExtension || 'webm';

            // Upload all recordings with unique IDs to local storage
            if (cameraBlob && cameraBlob.size > 0) {
                const cameraFilename = generateRecordingFilename(cameraRecordingId, 'vd', extension);
                formData.append('cameraVideo', cameraBlob, cameraFilename);
                formData.append('cameraRecordingId', cameraRecordingId);
            }
            if (screenBlob && screenBlob.size > 0) {
                const screenFilename = generateRecordingFilename(screenRecordingId, 'sc', extension);
                formData.append('screenVideo', screenBlob, screenFilename);
                formData.append('screenRecordingId', screenRecordingId);
            }

            // Upload to server with local storage system
            const response = await fetch('/api/exams/save-recording', {
                method: 'POST',
                body: formData
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            let result;

            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                // Response is not JSON (might be HTML error page or plain text)
                const textResponse = await response.text();
                console.error('❌ Non-JSON response received:', textResponse.substring(0, 500));

                return {
                    error: `Server error: ${response.statusText} `,
                    status: response.status,
                    details: textResponse.substring(0, 200)
                };
            }

            if (response.ok) {
                return result;
            } else {
                console.error('❌ Failed to save recordings:', response.status, result);
                // With local storage, files are saved directly to disk
                return { error: result.message || 'Upload failed', status: response.status };
            }
        } catch (error) {
            console.error('Error saving recordings:', error);
            return null;
        }
    }

    /**
     * Get live stream for monitoring
     */
    getLiveStreams() {
        return {
            camera: this.cameraStream,
            screen: this.screenStream
        };
    }

    /**
     * Check if recording is active
     */
    isActive() {
        return this.isRecording;
    }
}

export default RecordingManager;
