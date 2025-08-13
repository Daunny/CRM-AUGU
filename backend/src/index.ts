import app from './app';
import { config } from './config/env';
import prisma from './config/database';

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start server
    const server = app.listen(config.app.port, () => {
      console.log(`
        🚀 Server is running!
        🔧 Environment: ${config.app.env}
        📡 URL: http://localhost:${config.app.port}
        📚 API Docs: http://localhost:${config.app.port}/api-docs
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      console.log('\n📴 Shutting down gracefully...');
      
      server.close(() => {
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
