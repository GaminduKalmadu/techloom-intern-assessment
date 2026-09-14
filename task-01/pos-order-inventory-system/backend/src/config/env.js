const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isDevelopment = NODE_ENV === 'development';

// Required environment variables in production
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];

if (isProduction) {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `[FATAL] Missing required production environment variables: ${missing.join(', ')}. Server cannot start securely.`
    );
  }
}

// Allowed CORS origins
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const rawOrigins = process.env.ALLOWED_ORIGINS || frontendUrl;
const corsWhitelist = rawOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pos_db',
  JWT_SECRET: process.env.JWT_SECRET || (isProduction ? undefined : 'dev_jwt_secret_change_in_production'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_URL: frontendUrl,
  CORS_WHITELIST: corsWhitelist,
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  RESERVATION_TTL_MINUTES: parseInt(process.env.RESERVATION_TTL_MINUTES, 10) || 5,
  MOCK_PAYMENT_CONTROLS_ENABLED:
    process.env.MOCK_PAYMENT_CONTROLS_ENABLED !== undefined
      ? process.env.MOCK_PAYMENT_CONTROLS_ENABLED === 'true'
      : !isProduction,
  isProduction,
  isDevelopment,
};

module.exports = env;
