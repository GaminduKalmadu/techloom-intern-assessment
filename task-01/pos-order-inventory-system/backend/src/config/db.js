const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    logger.info('Using existing database connection');
    return;
  }

  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    autoIndex: env.isDevelopment,
  };

  try {
    const conn = await mongoose.connect(env.MONGO_URI, options);
    isConnected = true;
    logger.info(`MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    isConnected = false;
    logger.error(`MongoDB connection failed: ${error.message}`);
    // Do not crash server in dev so that API stubs & health checks can still be tested
    if (env.isProduction) {
      process.exit(1);
    }
  }
};

mongoose.connection.on('connected', () => {
  isConnected = true;
  logger.info('Mongoose default connection open');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  logger.error(`Mongoose default connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('Mongoose default connection disconnected');
});

const getDatabaseStatus = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateCode = mongoose.connection.readyState;
  return {
    state: states[stateCode] || 'unknown',
    isConnected: stateCode === 1,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
};

module.exports = {
  connectDB,
  getDatabaseStatus,
};
