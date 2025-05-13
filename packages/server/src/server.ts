// server.ts
import { createServer } from 'http';
import { app } from './app';
import { initWebSocket, getIO } from './lib/socket';
import { config } from './config/config';
import { logger } from './utils/logger';
import { workerManager } from './worker';
import { integrationService } from './services/integration.services';

// Create HTTP server with Express app
const httpServer = createServer(app);

// Initialize WebSocket server
const io = initWebSocket(httpServer);

// Initialize background workers
workerManager.init();

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
  logger.info(`New WebSocket connection: ${socket.id} (User: ${socket.data.user?.userId})`);

  // Subscribe to room for user-specific events
  socket.on('subscribe', (room) => {
    socket.join(room);
    logger.info(`Socket ${socket.id} joined room ${room}`);
  });

  // Forward integration events to clients
  integrationService.onEvent('new_event', (event) => {
    if (event.customerId) {
      io.to(`customer_${event.customerId}`).emit('new_event', event);
    }
    io.emit('new_event', event); // Send to all clients
  });

  integrationService.onEvent('new_alert', (alert) => {
    io.emit('new_alert', alert);
  });

  integrationService.onEvent('new_incident', (incident) => {
    if (incident.customerId) {
      io.to(`customer_${incident.customerId}`).emit('new_incident', incident);
    }
  });

  socket.on('disconnect', () => {
    logger.info(`WebSocket disconnected: ${socket.id}`);
  });
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Starting graceful shutdown...');
  
  try {
    await workerManager.shutdown();
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
httpServer.listen(config.port, () => {
  logger.info(`
  =====================================================
  🚀 SOAR Platform running on port ${config.port}
  =====================================================
  Environment: ${config.nodeEnv}
  REST API:    http://localhost:${config.port}/api
  WebSocket:   ws://localhost:${config.port}
  =====================================================
  `);
});