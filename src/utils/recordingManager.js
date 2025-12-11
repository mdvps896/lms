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
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm;codecs=vp8';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'video/webm';
                }
            }

            console.log('Using MIME type:', mimeType);

            // Start camera recording only if camera stream exists
            if (this.cameraStream) {
                this.cameraRecorder = new MediaRecorder(this.cameraStream, {
                    mimeType: mimeType,
                    videoBitsPerSecond: 1000000  // 1MB - good quality for local storage
                });

                this.cameraRecorder.ondataavailable = (event) => {
                    if (event.data && event.data.size > 0) {
                        console.log('📹 Camera chunk received:', event.data.size, 'bytes');
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
                        console.log('Screen chunk received:', event.data.size, 'bytes');
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

            console.log('Recording started successfully');

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
            console.log('Recording already stopped');
            return null;
        }

        console.log('Stopping recordings...');

        return new Promise((resolve) => {
            let stoppedCount = 0;
            const totalRecorders = (this.cameraRecorder ? 1 : 0) + (this.screenRecorder ? 1 : 0);

            const checkComplete = () => {
                stoppedCount++;
                console.log(`Recorder stopped (${stoppedCount}/${totalRecorders})`);
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
            console.log('💾 Saving exam recordings to local storage with unique IDs...');
            console.log('📹 Camera chunks:', this.cameraChunks.length);
            console.log('🖥️ Screen chunks:', this.screenChunks.length);
            
            // Create blobs only for enabled recordings
            const cameraBlob = this.cameraChunks.length > 0 ? new Blob(this.cameraChunks, { type: 'video/mp4;codecs=avc1' }) : null;
            const screenBlob = this.screenChunks.length > 0 ? new Blob(this.screenChunks, { type: 'video/mp4;codecs=avc1' }) : null;

            if (cameraBlob) {
                console.log('Camera blob size:', cameraBlob.size, 'bytes');
            }
            if (screenBlob) {
                console.log('Screen blob size:', screenBlob.size, 'bytes');
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
                console.log('🆔 Generated Camera ID:', cameraRecordingId);
            }
            if (screenBlob && screenBlob.size > 0) {
                screenRecordingId = await generateRecordingId('sc', this.attemptId, this.examId);
                console.log('🆔 Generated Screen ID:', screenRecordingId);
            }

            // Local Storage Upload
            const totalSize = (cameraBlob?.size || 0) + (screenBlob?.size || 0);
            console.log(`📊 Total recording size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
            console.log('📁 Using local storage upload system!');

            // Create form data with all recordings and unique IDs
            const formData = new FormData();
            formData.append('attemptId', this.attemptId);
            formData.append('examId', this.examId);
            
            // Upload all recordings with unique IDs to local storage
            if (cameraBlob && cameraBlob.size > 0) {
                const cameraFilename = generateRecordingFilename(cameraRecordingId, 'vd');
                formData.append('cameraVideo', cameraBlob, cameraFilename);
                formData.append('cameraRecordingId', cameraRecordingId);
                console.log(`📹 Camera video: ${(cameraBlob.size / 1024 / 1024).toFixed(2)} MB - ID: ${cameraRecordingId}`);
            }
            if (screenBlob && screenBlob.size > 0) {
                const screenFilename = generateRecordingFilename(screenRecordingId, 'sc');
                formData.append('screenVideo', screenBlob, screenFilename);
                formData.append('screenRecordingId', screenRecordingId);
                console.log(`🖥️ Screen video: ${(screenBlob.size / 1024 / 1024).toFixed(2)} MB - ID: ${screenRecordingId}`);
            }

            console.log('⬆️ Uploading to local storage...');

            // Upload to server with local storage system
            const response = await fetch('/api/exams/save-recording', {
                method: 'POST',
                body: formData
            });

            console.log('📡 Response status:', response.status, response.statusText);
            console.log('📡 Response headers:', {
                contentType: response.headers.get('content-type'),
                contentLength: response.headers.get('content-length')
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
                    error: `Server error: ${response.statusText}`, 
                    status: response.status,
                    details: textResponse.substring(0, 200)
                };
            }

            if (response.ok) {
                console.log('🎉 Exam recordings saved successfully to local storage!');
                console.log('📈 Upload stats:', result.recordingStats);
                return result;
            } else {
                console.error('❌ Failed to save recordings:', response.status, result);
                // With local storage, files are saved directly to disk
                console.log('🔄 Enhanced upload system handles large files automatically');
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
