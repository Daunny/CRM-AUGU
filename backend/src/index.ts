import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { rateLimit } from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Import configuration
import { config } from './config/app';
import prisma from './config/database';
import logger from './utils/logger';

// Import middleware
import { requestLogger, errorHandler, notFoundHandler } from './middleware/error.middleware';

// Import routes
import routes from './routes';

// Create Express app
const app = express();
const httpServer = createServer(app);

// Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origin,
    methods: config.cors.methods,
    credentials: config.cors.credentials
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: config.rateLimit.message,
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to API routes
app.use('/api', limiter);

// Request logging
app.use(requestLogger);

// API Routes
app.use('/api', routes);

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Socket client connected: ${socket.id}`);
  
  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    logger.info(`Socket ${socket.id} joined room: ${roomId}`);
  });
  
  socket.on('leave-room', (roomId: string) => {
    socket.leave(roomId);
    logger.info(`Socket ${socket.id} left room: ${roomId}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Socket client disconnected: ${socket.id}`);
  });
});

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  // Close server
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });
  
  // Close database connection
  await prisma.$disconnect();
  logger.info('Database connection closed');
  
  // Close Redis connection
  // await redisClient.quit();
  
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { promise, reason });
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start server
const PORT = config.app.port;

httpServer.listen(PORT, () => {
  logger.info(`
    🚀 Server is running!
    📍 Environment: ${config.app.env}
    🌐 URL: ${config.app.url}
    🔌 Port: ${PORT}
    📝 API Docs: ${config.app.url}/api
    ❤️  Health: ${config.app.url}/api/health
  `);
});

// Export for testing
export { app, io, httpServer };