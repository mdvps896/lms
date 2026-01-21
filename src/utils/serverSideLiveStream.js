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

        // Capture and send frames every 500ms (2 FPS for smooth streaming)
        this.intervalId = setInterval(() => {
            this.captureAndSendFrames();
        }, 500);

        }

    /**
     * Capture current frame from streams and send to server
     */
    async captureAndSendFrames() {
        if (!this.isStreaming) return;

        const promises = [];

        try {
            // Capture camera frame
            if (this.cameraStream && this.cameraStream.active) {
                promises.push(
                    this.captureFrame(this.cameraStream, 'camera')
                        .then(blob => {
                            if (blob) return this.sendFrame(blob, 'camera');
                        })
                        .catch(error => console.warn('Camera frame capture failed:', error))
                );
            }

            // Capture screen frame
            if (this.screenStream && this.screenStream.active) {
                promises.push(
                    this.captureFrame(this.screenStream, 'screen')
                        .then(blob => {
                            if (blob) return this.sendFrame(blob, 'screen');
                        })
                        .catch(error => console.warn('Screen frame capture failed:', error))
                );
            }

            // Wait for all frames to be processed (with timeout)
            await Promise.allSettled(promises);
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
                // Check if stream is active
                if (!stream || stream.getVideoTracks().length === 0) {
                    console.warn(`No video track available for ${type} stream`);
                    resolve(null);
                    return;
                }

                // Check if video track is active
                const videoTrack = stream.getVideoTracks()[0];
                if (!videoTrack || videoTrack.readyState !== 'live') {
                    console.warn(`Video track not active for ${type} stream`);
                    resolve(null);
                    return;
                }

                const video = document.createElement('video');
                video.srcObject = stream;
                video.muted = true;
                video.playsInline = true;
                video.autoplay = true;

                const timeoutId = setTimeout(() => {
                    video.srcObject = null;
                    resolve(null);
                }, 5000); // 5 second timeout

                video.onloadedmetadata = () => {
                    video.play().then(() => {
                        // Wait a bit for the video to start playing
                        setTimeout(() => {
                            try {
                                const canvas = document.createElement('canvas');
                                canvas.width = type === 'camera' ? 640 : 1280;
                                canvas.height = type === 'camera' ? 480 : 720;

                                const ctx = canvas.getContext('2d');
                                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                                canvas.toBlob((blob) => {
                                    clearTimeout(timeoutId);
                                    video.srcObject = null;
                                    resolve(blob);
                                }, 'image/jpeg', 0.8);
                            } catch (drawError) {
                                clearTimeout(timeoutId);
                                video.srcObject = null;
                                console.error('Error drawing to canvas:', drawError);
                                resolve(null);
                            }
                        }, 200);
                    }).catch((playError) => {
                        clearTimeout(timeoutId);
                        video.srcObject = null;
                        console.error('Error playing video:', playError);
                        resolve(null);
                    });
                };

                video.onerror = (error) => {
                    clearTimeout(timeoutId);
                    console.error('Video error for', type, error);
                    video.srcObject = null;
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
        }
}

export default ServerSideLiveStream;
