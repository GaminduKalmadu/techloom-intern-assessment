const ApiError = require('../utils/apiError');
const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Normalize unexpected errors to ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || null);
  }

  const response = {
    success: false,
    message: error.message,
    ...(error.errors && { errors: error.errors }),
    ...(error.code && { code: error.code }),
    ...(env.isDevelopment && { stack: error.stack }),
  };

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
