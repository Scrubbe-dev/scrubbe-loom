"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initWebSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const initWebSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST']
        }
    });
    io.on('connection', (socket) => {
        socket.on('subscribe', (room) => {
            socket.join(room);
        });
    });
    return io;
};
exports.initWebSocket = initWebSocket;
const getIO = () => {
    if (!io)
        throw new Error('Socket.io not initialized!');
    return io;
};
exports.getIO = getIO;
