const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const logger = require('./utils/logger');
const mongoose = require('mongoose');
const {
  startReservationScheduler,
  stopReservationScheduler,
} = require('./schedulers/reservation.scheduler');

const server = http.createServer(app);

const startServer = async () => {
  try {
    // Attempt database connection
    logger.info('Connecting to MongoDB database...');
    await connectDB();

    // Start background reservation expiration scheduler (runs every minute)
    startReservationScheduler('* * * * *');

    // Start listening
    server.listen(env.PORT, () => {
      logger.info(`===============================================`);
      logger.info(` POS Order & Inventory System Backend Running`);
      logger.info(` Mode: ${env.NODE_ENV}`);
      logger.info(` Port: ${env.PORT}`);
      logger.info(` URL:  http://localhost:${env.PORT}`);
      logger.info(` Health: http://localhost:${env.PORT}/api/v1/health`);
      logger.info(`===============================================`);
    });
  } catch (error) {
    logger.error(`Critical error starting server: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.warn(`Received ${signal}. Starting graceful shutdown...`);

  // Stop background scheduler tasks
  stopReservationScheduler();

  server.close(async () => {
    logger.info('HTTP server closed. Terminating database connections...');
    try {
      await mongoose.connection.close(false);
      logger.info('MongoDB connection safely terminated.');
      process.exit(0);
    } catch (err) {
      logger.error(`Error during MongoDB disconnection: ${err.message}`);
      process.exit(1);
    }
  });

  // Force shutdown if connections do not close in 10s
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error });
  process.exit(1);
});

startServer();
