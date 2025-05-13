"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts
const http_1 = require("http");
const app_1 = require("./app");
const socket_1 = require("./lib/socket");
const config_1 = require("./config/config");
const logger_1 = require("./utils/logger");
const worker_1 = require("./worker");
const integration_services_1 = require("./services/integration.services");
// Create HTTP server with Express app
const httpServer = (0, http_1.createServer)(app_1.app);
// Initialize WebSocket server
const io = (0, socket_1.initWebSocket)(httpServer);
// Initialize background workers
worker_1.workerManager.init();
// WebSocket authentication middleware
// io.use((socket, next) => {
//   try {
//     const token = socket.handshake.auth.token;
//     if (!token) {
//       throw new Error('Authentication error: No token provided');
//     }
//     // Verify token (using your existing token manager)
//     const decoded = verifyToken(token);
//     socket.data.user = decoded;
//     next();
//   } catch (error) {
//     logger.error('WebSocket authentication failed:', error);
//     next(new Error('Authentication failed'));
//   }
// });
// WebSocket connection handler
io.on('connection', (socket) => {
    logger_1.logger.info(`New WebSocket connection: ${socket.id} (User: ${socket.data.user?.userId})`);
    // Subscribe to room for user-specific events
    socket.on('subscribe', (room) => {
        socket.join(room);
        logger_1.logger.info(`Socket ${socket.id} joined room ${room}`);
    });
    // Forward integration events to clients
    integration_services_1.integrationService.onEvent('new_event', (event) => {
        if (event.customerId) {
            io.to(`customer_${event.customerId}`).emit('new_event', event);
        }
        io.emit('new_event', event); // Send to all clients
    });
    integration_services_1.integrationService.onEvent('new_alert', (alert) => {
        io.emit('new_alert', alert);
    });
    integration_services_1.integrationService.onEvent('new_incident', (incident) => {
        if (incident.customerId) {
            io.to(`customer_${incident.customerId}`).emit('new_incident', incident);
        }
    });
    socket.on('disconnect', () => {
        logger_1.logger.info(`WebSocket disconnected: ${socket.id}`);
    });
});
// Graceful shutdown
const shutdown = async () => {
    logger_1.logger.info('Starting graceful shutdown...');
    try {
        await worker_1.workerManager.shutdown();
        httpServer.close(() => {
            logger_1.logger.info('HTTP server closed');
            process.exit(0);
        });
    }
    catch (error) {
        logger_1.logger.error('Error during shutdown:', error);
        process.exit(1);
    }
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// Start the server
httpServer.listen(config_1.config.port, () => {
    logger_1.logger.info(`
  =====================================================
  🚀 SOAR Platform running on port ${config_1.config.port}
  =====================================================
  Environment: ${config_1.config.nodeEnv}
  REST API:    http://localhost:${config_1.config.port}/api
  WebSocket:   ws://localhost:${config_1.config.port}
  =====================================================
  `);
});
