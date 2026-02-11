/**
 * Exam Attendance Tracker Utility
 * Handles periodic selfie capture and location tracking for exams.
 */

class ExamAttendanceTracker {
    constructor(config) {
        this.attemptId = config.attemptId;
        this.examId = config.examId;
        this.courseId = config.courseId || 'unknown';
        this.userId = config.userId;
        this.interval = config.interval || 300000; // Default 5 minutes
        this.isFreeMaterial = config.courseId === 'free_material';

        this.stream = null;
        this.timer = null;
        this.isTracking = false;
    }

    async start(stream) {
        if (this.isTracking) return;
        this.stream = stream;
        this.isTracking = true;

        // Capture immediately
        await this.captureAndUpload('test_initial');

        // Setup periodic capture
        this.timer = setInterval(() => {
            this.captureAndUpload('test_periodic');
        }, this.interval);

        }

    stop() {
        if (this.timer) clearInterval(this.timer);
        this.isTracking = false;
        }

    async captureAndUpload(type) {
        if (!this.stream) return;

        try {
            // 1. Get Location
            let location = { latitude: null, longitude: null, locationName: 'Web Browser' };
            try {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
                });
                location.latitude = pos.coords.latitude;
                location.longitude = pos.coords.longitude;
            } catch (err) {
                console.warn('[ExamAttendanceTracker] Location error:', err);
            }

            // 2. Capture Frame from Stream
            const video = document.createElement('video');
            video.srcObject = this.stream;
            await video.play();

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
            video.srcObject = null;

            // 3. Upload
            const formData = new FormData();
            formData.append('selfie', blob, `selfie_${Date.now()}.jpg`);
            formData.append('courseId', this.courseId);
            formData.append('examId', this.examId);
            formData.append('sessionId', this.attemptId);
            formData.append('captureType', type);
            formData.append('latitude', location.latitude || '');
            formData.append('longitude', location.longitude || '');
            formData.append('locationName', location.locationName || '');

            const response = await fetch('/api/student/selfies/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                }

        } catch (error) {
            console.error(`[ExamAttendanceTracker] ${type} failed:`, error);
        }
    }
}

export default ExamAttendanceTracker;
