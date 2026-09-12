const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

const dns = require('dns');

// If connecting via SRV (mongodb+srv://), ensure Node can resolve Atlas records
if (env.MONGO_URI && env.MONGO_URI.startsWith('mongodb+srv://')) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch (err) {
    logger.warn(`Could not set fallback DNS servers: ${err.message}`);
  }
}

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    logger.info('Using existing database connection');
    return;
  }

  // Strip accidental enclosing quotes from URI
  const rawUri = (env.MONGO_URI || '').trim().replace(/^["']|["']$/g, '');

  const options = {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
    autoIndex: env.isDevelopment,
  };

  try {
    const conn = await mongoose.connect(rawUri, options);
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
