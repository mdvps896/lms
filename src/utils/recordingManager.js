/**
 * Recording Manager for Exam Proctoring
 * Handles camera, microphone, and screen recording
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
    async startRecording(attemptId, examId) {
        this.attemptId = attemptId;
        this.examId = examId;

        try {
            // Request camera and microphone
            this.cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: true
            });

            // Request screen recording
            this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: 1920,
                    height: 1080,
                    frameRate: 30
                },
                audio: true
            });

            // Determine best codec
            let mimeType = 'video/webm;codecs=vp9';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm;codecs=vp8';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'video/webm';
                }
            }

            console.log('Using MIME type:', mimeType);

            // Start camera recording - DON'T pass timeslice to get one continuous recording
            this.cameraRecorder = new MediaRecorder(this.cameraStream, {
                mimeType: mimeType,
                videoBitsPerSecond: 2500000
            });

            this.cameraRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    console.log('Camera chunk received:', event.data.size, 'bytes');
                    this.cameraChunks.push(event.data);
                }
            };

            this.cameraRecorder.onerror = (event) => {
                console.error('Camera recorder error:', event.error);
            };

            // Start screen recording - DON'T pass timeslice to get one continuous recording
            this.screenRecorder = new MediaRecorder(this.screenStream, {
                mimeType: mimeType,
                videoBitsPerSecond: 5000000
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

            // Start both recordings WITHOUT timeslice parameter
            // This will create one continuous recording until stop() is called
            this.cameraRecorder.start();
            this.screenRecorder.start();
            this.isRecording = true;

            console.log('Recording started successfully');

            // Handle stream end (user stops sharing)
            this.screenStream.getVideoTracks()[0].addEventListener('ended', () => {
                console.warn('Screen sharing stopped by user');
                this.handleScreenShareStopped();
            });

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
            const totalRecorders = 2;

            const checkComplete = () => {
                stoppedCount++;
                console.log(`Recorder stopped (${stoppedCount}/${totalRecorders})`);
                if (stoppedCount === totalRecorders) {
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
            console.log('Saving recordings...');
            console.log('Camera chunks:', this.cameraChunks.length);
            console.log('Screen chunks:', this.screenChunks.length);

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

            // Create blobs
            const cameraBlob = new Blob(this.cameraChunks, { type: 'video/webm' });
            const screenBlob = new Blob(this.screenChunks, { type: 'video/webm' });

            console.log('Camera blob size:', cameraBlob.size, 'bytes');
            console.log('Screen blob size:', screenBlob.size, 'bytes');

            if (cameraBlob.size === 0 || screenBlob.size === 0) {
                console.error('One or more recordings are empty!');
                return null;
            }

            // Create form data
            const formData = new FormData();
            formData.append('attemptId', this.attemptId);
            formData.append('examId', this.examId);
            formData.append('cameraVideo', cameraBlob, `camera-${this.attemptId}-${timestamp}.webm`);
            formData.append('screenVideo', screenBlob, `screen-${this.attemptId}-${timestamp}.webm`);

            console.log('Uploading to server...');

            // Upload to server
            const response = await fetch('/api/exams/save-recording', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                console.log('Recordings saved successfully:', result);
                return result;
            } else {
                console.error('Failed to save recordings:', result);
                return null;
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
