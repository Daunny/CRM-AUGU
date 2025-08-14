import app from './app';
import { config } from './config/env';
import prisma from './config/database';
import { startTaskReminderJob, startOverdueTaskJob } from './jobs/task-reminders.job';
import { startFileCleanupJob, startOrphanedFileCleanupJob } from './jobs/file-cleanup.job';
import { createServer } from 'http';
import { initializeSocket } from './config/socket';

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start cron jobs
    startTaskReminderJob();
    startOverdueTaskJob();
    startFileCleanupJob();
    startOrphanedFileCleanupJob();
    console.log('⏰ Cron jobs started');

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.io
    const socketManager = initializeSocket(httpServer);
    console.log('🔌 Socket.io initialized');

    // Make socket manager available globally
    (global as any).socketManager = socketManager;

    // Start server
    httpServer.listen(config.app.port, () => {
      console.log(`
        🚀 Server is running!
        🔧 Environment: ${config.app.env}
        📡 URL: http://localhost:${config.app.port}
        🔌 WebSocket: ws://localhost:${config.app.port}
        📚 API Docs: http://localhost:${config.app.port}/api-docs
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      console.log('\n📴 Shutting down gracefully...');
      
      httpServer.close(() => {
        console.log('🛑 Server closed');
      });

      await prisma.$disconnect();
      console.log('🔌 Database disconnected');
      
      process.exit(0);
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
