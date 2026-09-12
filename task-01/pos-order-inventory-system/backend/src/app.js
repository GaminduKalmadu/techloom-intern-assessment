const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const httpLogger = require('./middleware/logger.middleware');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');
const apiRoutes = require('./routes');

const app = express();

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: env.isProduction ? undefined : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // In development allow any localhost or matching CORS_ORIGIN
    if (env.isDevelopment || origin === env.CORS_ORIGIN) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// 3. Request Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. HTTP Request Logging
app.use(httpLogger);

// 5. Rate Limiting for all API requests
app.use('/api', apiLimiter);

// 6. Base Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'POS Order & Inventory System API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/v1/health',
  });
});

// 7. Mount API v1 Routes
app.use('/api/v1', apiRoutes);

// 8. Handle 404 Not Found
app.use(notFoundHandler);

// 9. Central Error Handler
app.use(errorHandler);

module.exports = app;
