/**
 * WebRTC Stream Manager for Live Proctoring
 * Handles peer-to-peer video streaming between student and admin
 */

import { io } from 'socket.io-client';

class LiveStreamManager {
    constructor() {
        this.socket = null;
        this.peerConnection = null;
        this.cameraStream = null;
        this.screenStream = null;
        this.attemptId = null;
        this.isStudent = false;
    }

    /**
     * Initialize socket connection
     */
    async initialize(attemptId, isStudent = false) {
        this.attemptId = attemptId;
        this.isStudent = isStudent;

        // Check if we're in production (Vercel)
        const isProduction = typeof window !== 'undefined' && 
                            (window.location.hostname.includes('vercel.app') || 
                             window.location.hostname.includes('ex2-iota.vercel.app'));

        if (isProduction) {
            console.log('Production mode: Using HTTP polling for live monitoring');
            // In production, use periodic API polling instead of WebSocket
            this.startPollingMode();
            return;
        }

        // Development: Use Socket.io
        this.socket = io({
            path: '/api/socket',
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
            this.socket.emit('join-attempt', attemptId);
        });

        if (!isStudent) {
            // Admin: Listen for stream offers
            this.socket.on('stream-offer', async ({ offer, streamType, socketId }) => {
                console.log('Received stream offer for:', streamType);
                await this.handleStreamOffer(offer, streamType, socketId);
            });
        } else {
            // Student: Listen for stream answers
            this.socket.on('stream-answer', async ({ answer }) => {
                console.log('Received stream answer');
                if (this.peerConnection) {
                    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                }
            });
        }

        // Handle ICE candidates
        this.socket.on('ice-candidate', async ({ candidate }) => {
            if (this.peerConnection && candidate) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });
    }

    /**
     * Student: Start streaming camera and screen
     */
    async startStreaming(cameraStream, screenStream) {
        this.cameraStream = cameraStream;
        this.screenStream = screenStream;

        // Check if production mode
        const isProduction = typeof window !== 'undefined' && 
                            (window.location.hostname.includes('vercel.app') || 
                             !window.location.hostname.includes('localhost'));

        if (isProduction) {
            // Production: Start polling mode
            console.log('Starting production polling mode');
            this.startPollingMode();
            return { success: true, mode: 'polling' };
        }

        // Development: WebRTC mode
        // Create peer connection
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        // Add tracks to peer connection
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, cameraStream);
            });
        }

        if (screenStream) {
            screenStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, screenStream);
            });
        }

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    targetSocketId: null // Broadcast to room
                });
            }
        };

        // Create and send offer
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        this.socket.emit('stream-offer', {
            attemptId: this.attemptId,
            offer: offer,
            streamType: 'combined'
        });
    }

    /**
     * Admin: Handle incoming stream offer
     */
    async handleStreamOffer(offer, streamType, socketId) {
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        // Handle incoming tracks
        this.peerConnection.ontrack = (event) => {
            console.log('Received track:', event.track.kind);
            if (this.onTrackReceived) {
                this.onTrackReceived(event.streams[0], streamType);
            }
        };

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    targetSocketId: socketId
                });
            }
        };

        // Set remote description and create answer
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        // Send answer back
        this.socket.emit('stream-answer', {
            answer: answer,
            targetSocketId: socketId
        });
    }

    /**
     * Set callback for when track is received (admin side)
     */
    setOnTrackReceived(callback) {
        this.onTrackReceived = callback;
    }

    /**
     * Stop streaming and cleanup
     */
    stopStreaming() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /**
     * Production mode: Use HTTP polling for monitoring
     */
    startPollingMode() {
        if (this.isStudent) {
            // Student: Send snapshots periodically
            this.pollingInterval = setInterval(() => {
                this.sendSnapshotToServer();
            }, 3000); // Every 3 seconds
        }
    }

    /**
     * Capture and send snapshot to server (Production mode)
     */
    async sendSnapshotToServer() {
        try {
            if (!this.cameraStream) return;

            // Create canvas and capture frame
            const video = document.createElement('video');
            video.srcObject = this.cameraStream;
            video.play();

            await new Promise(resolve => {
                video.onloadedmetadata = resolve;
            });

            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.7);
            });

            // Send to server
            const formData = new FormData();
            formData.append('snapshot', blob);
            formData.append('attemptId', this.attemptId);
            formData.append('timestamp', Date.now());

            await fetch('/api/live-snapshot', {
                method: 'POST',
                body: formData
            });

        } catch (error) {
            console.error('Error sending snapshot:', error);
        }
    }
}

export default LiveStreamManager;