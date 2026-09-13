const app = require('./src/app');
const env = require('./src/config/env');
const { connectDB } = require('./src/config/db');

let server;

const startServer = async () => {
  try {
    // 1. Establish database connection
    await connectDB();

    // 2. Start Express server
    server = app.listen(env.PORT, () => {
      console.log(`[Server] Running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      console.log(`[Server] Health check: http://localhost:${env.PORT}/api/health`);
    });
  } catch (error) {
    console.error('[Server Error] Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
