const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * Handle 404 Not Found routes
 */
const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Cannot find ${req.method} ${req.originalUrl} on this server`));
};

/**
 * Central Error Handling Middleware
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Convert non-ApiError errors into ApiError instances
  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';

    // Handle Mongoose Bad ObjectId (CastError)
    if (error.name === 'CastError') {
      message = `Invalid format for field ${error.path}: ${error.value}`;
      statusCode = 400;
    }

    // Handle Mongoose Duplicate Key Error (Code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || 'field';
      message = `Duplicate value entered for ${field}. Please use another value.`;
      statusCode = 409;
    }

    // Handle Mongoose Validation Errors
    if (error.name === 'ValidationError') {
      message = Object.values(error.errors)
        .map((val) => val.message)
        .join(', ');
      statusCode = 400;
    }

    // Handle JWT Errors
    if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token. Please authenticate again.';
      statusCode = 401;
    }

    error = new ApiError(statusCode, message, error.errors || null, false, error.stack);
  }

  // Log error with Winston
  if (error.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${error.message}`, {
      stack: error.stack,
    });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - ${error.statusCode} ${error.message}`);
  }

  const responsePayload = {
    success: false,
    message: error.message,
  };

  if (error.code) {
    responsePayload.code = error.code;
  }

  if (error.errors) {
    responsePayload.errors = error.errors;
  }

  if (env.isDevelopment) {
    responsePayload.stack = error.stack;
  }

  res.status(error.statusCode).json(responsePayload);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
