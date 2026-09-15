const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/error.middleware');
const notFoundHandler = require('./middleware/notFound.middleware');

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. CORS Configuration using CLIENT_URL
const configuredOrigins = env.CLIENT_URL ? env.CLIENT_URL.split(',').map((o) => o.trim()) : [];
const allowedOrigins = Array.from(new Set([...configuredOrigins, 'http://localhost:3000'].filter(Boolean)));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // Allow wildcard, explicit list, localhost, or any vercel.app preview/production deployment
    const isAllowed =
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(origin) ||
      origin.includes('localhost') ||
      origin.endsWith('.vercel.app');

    if (isAllowed) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 3. HTTP Request Logger
if (env.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 4. Request Body Parsers (supports image uploads up to 10 MB)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// 5. API Routes (/api)
app.use('/api', routes);

// 6. 404 Route Handler
app.use(notFoundHandler);

// 7. Centralized Error Handler
app.use(errorHandler);

module.exports = app;
