const morgan = require('morgan');
const logger = require('../utils/logger');
const env = require('../config/env');

// Stream object for Morgan to write logs into Winston
const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Custom format or standard 'combined' for prod / 'dev' for dev
const format = env.isProduction
  ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'
  : ':method :url :status :response-time ms - :res[content-length]';

const httpLogger = morgan(format, {
  stream: morganStream,
  skip: (req) => {
    // Optionally skip logging health checks in production if noisy
    return env.isProduction && req.url === '/api/v1/health';
  },
});

module.exports = httpLogger;
