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
const allowedOrigins = [env.CLIENT_URL, 'http://localhost:3000'].filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman) or matched origin
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. HTTP Request Logger
if (env.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 4. Request Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. API Routes (/api)
app.use('/api', routes);

// 6. 404 Route Handler
app.use(notFoundHandler);

// 7. Centralized Error Handler
app.use(errorHandler);

module.exports = app;
