import { Server } from 'socket.io';

let io;

export default function SocketHandler(req, res) {
    if (!res.socket.server.io) {
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
            // Join room for specific attempt
            socket.on('join-attempt', (attemptId) => {
                socket.join(`attempt-${attemptId}`);
                });

            // Student sends video stream offer
            socket.on('stream-offer', ({ attemptId, offer, streamType }) => {
                socket.to(`attempt-${attemptId}`).emit('stream-offer', {
                    offer,
                    streamType,
                    socketId: socket.id
                });
            });

            // Admin sends answer
            socket.on('stream-answer', ({ answer, targetSocketId }) => {
                io.to(targetSocketId).emit('stream-answer', { answer });
            });

            // ICE candidates exchange
            socket.on('ice-candidate', ({ candidate, targetSocketId }) => {
                if (targetSocketId) {
                    io.to(targetSocketId).emit('ice-candidate', { candidate });
                }
            });

            socket.on('disconnect', () => {
                });
        });
    }

    res.end();
}
