const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';

const env = {
  NODE_ENV,
  PORT: parseInt(process.env.PORT, 10) || 5001,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce_db',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_key_change_in_production',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  isProduction: NODE_ENV === 'production',
  isDevelopment: NODE_ENV === 'development',
};

module.exports = env;
