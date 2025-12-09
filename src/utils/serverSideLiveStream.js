/**
 * Server-Side Live Stream Manager
 * Captures video frames and sends them to server
 */

class ServerSideLiveStream {
    constructor() {
        this.cameraStream = null;
        this.screenStream = null;
        this.attemptId = null;
        this.isStreaming = false;
        this.intervalId = null;
    }

    /**
     * Start streaming by capturing frames and sending to server
     */
    async startStreaming(attemptId, cameraStream, screenStream) {
        this.attemptId = attemptId;
        this.cameraStream = cameraStream;
        this.screenStream = screenStream;
        this.isStreaming = true;

        console.log('Starting server-side live streaming...');

        // Capture and send frames every 500ms (2 FPS for smooth streaming)
        this.intervalId = setInterval(() => {
            this.captureAndSendFrames();
        }, 500);

        console.log('✅ Server-side streaming started');
    }

    /**
     * Capture current frame from streams and send to server
     */
    async captureAndSendFrames() {
        if (!this.isStreaming) return;

        try {
            // Capture camera frame
            if (this.cameraStream) {
                const cameraBlob = await this.captureFrame(this.cameraStream, 'camera');
                if (cameraBlob) {
                    await this.sendFrame(cameraBlob, 'camera');
                }
            }

            // Capture screen frame
            if (this.screenStream) {
                const screenBlob = await this.captureFrame(this.screenStream, 'screen');
                if (screenBlob) {
                    await this.sendFrame(screenBlob, 'screen');
                }
            }
        } catch (error) {
            console.error('Error capturing frames:', error);
        }
    }

    /**
     * Capture a single frame from MediaStream
     */
    async captureFrame(stream, type) {
        return new Promise((resolve) => {
            try {
                const video = document.createElement('video');
                video.srcObject = stream;
                video.muted = true;
                video.playsInline = true;

                video.onloadedmetadata = () => {
                    video.play();

                    // Wait a bit for the video to start
                    setTimeout(() => {
                        const canvas = document.createElement('canvas');
                        canvas.width = type === 'camera' ? 640 : 1280;
                        canvas.height = type === 'camera' ? 480 : 720;

                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                        canvas.toBlob((blob) => {
                            video.srcObject = null;
                            resolve(blob);
                        }, 'image/jpeg', 0.8);
                    }, 100);
                };

                video.onerror = () => {
                    console.error('Video error for', type);
                    resolve(null);
                };
            } catch (error) {
                console.error('Error in captureFrame:', error);
                resolve(null);
            }
        });
    }

    /**
     * Send frame to server
     */
    async sendFrame(blob, streamType) {
        try {
            const formData = new FormData();
            formData.append('attemptId', this.attemptId);
            formData.append('streamType', streamType);
            formData.append('chunk', blob);

            await fetch('/api/exams/live-stream', {
                method: 'POST',
                body: formData
            });
        } catch (error) {
            // Silently fail - don't spam console
            // console.error('Error sending frame:', error);
        }
    }

    /**
     * Stop streaming
     */
    stopStreaming() {
        this.isStreaming = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('Server-side streaming stopped');
    }
}

export default ServerSideLiveStream;
