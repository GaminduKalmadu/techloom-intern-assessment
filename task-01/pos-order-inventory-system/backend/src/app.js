const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const httpLogger = require('./middleware/logger.middleware');
const sanitizeInput = require('./middleware/sanitize.middleware');
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

// 2. CORS Whitelist Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl, mobile tools)
    if (!origin) return callback(null, true);

    // Development allows any localhost or configured whitelist origins
    if (env.isDevelopment) {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:') || env.CORS_WHITELIST.includes(origin)) {
        return callback(null, true);
      }
    }

    // Production checks strict CORS whitelist
    if (env.CORS_WHITELIST.includes('*') || env.CORS_WHITELIST.includes(origin) || (origin && origin.includes('vercel.app'))) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is blocked by CORS security whitelist`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key'],
};
app.use(cors(corsOptions));

// 3. Request Body Parsers (with safe payload size limits supporting device images up to 10MB)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// 4. Input Sanitization (NoSQL injection prevention & input trimming)
app.use(sanitizeInput);

// 5. HTTP Request Logging via Morgan & Winston
app.use(httpLogger);

// 6. Global API Rate Limiting
app.use('/api', apiLimiter);

// 7. Root Health / Info Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'POS Order & Inventory System API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/v1/health',
  });
});

// 8. Mount Centralized API Routes
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const reportRoutes = require('./routes/report.routes');
const settingRoutes = require('./routes/setting.routes');
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/v1', apiRoutes);

// 9. 404 Route Not Found Handler
app.use(notFoundHandler);

// 10. Central Error Handler
app.use(errorHandler);

module.exports = app;
