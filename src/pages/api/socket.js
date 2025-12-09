import { Server } from 'socket.io';

let io;

export default function SocketHandler(req, res) {
    if (!res.socket.server.io) {
        console.log('Setting up Socket.io server...');

        io = new Server(res.socket.server, {
            path: '/api/socket',
            addTrailingSlash: false,
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        res.socket.server.io = io;

        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            // Join room for specific attempt
            socket.on('join-attempt', (attemptId) => {
                socket.join(`attempt-${attemptId}`);
                console.log(`Socket ${socket.id} joined attempt-${attemptId}`);
            });

            // Student sends video stream offer
            socket.on('stream-offer', ({ attemptId, offer, streamType }) => {
                console.log(`Stream offer from ${socket.id} for ${streamType}`);
                socket.to(`attempt-${attemptId}`).emit('stream-offer', {
                    offer,
                    streamType,
                    socketId: socket.id
                });
            });

            // Admin sends answer
            socket.on('stream-answer', ({ answer, targetSocketId }) => {
                console.log(`Stream answer to ${targetSocketId}`);
                io.to(targetSocketId).emit('stream-answer', { answer });
            });

            // ICE candidates exchange
            socket.on('ice-candidate', ({ candidate, targetSocketId }) => {
                if (targetSocketId) {
                    io.to(targetSocketId).emit('ice-candidate', { candidate });
                }
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }

    res.end();
}
