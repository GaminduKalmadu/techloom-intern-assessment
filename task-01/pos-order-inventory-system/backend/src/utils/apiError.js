class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable error description
   * @param {Array|Object|null} errors - Specific validation or field errors
   * @param {boolean} isOperational - True if expected operational error
   * @param {string} stack - Optional stack trace
   */
  constructor(statusCode, message, errors = null, isOperational = true, stack = '', code = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    this.code = code;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message = 'Bad Request', errors = null) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden access') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource conflict or duplicate entry') {
    return new ApiError(409, message);
  }

  static coded(statusCode, code, message, errors = null) {
    return new ApiError(statusCode, message, errors, true, '', code);
  }

  static unprocessable(message = 'Unprocessable entity', errors = null) {
    return new ApiError(422, message, errors);
  }

  static tooManyRequests(message = 'Too many requests, please slow down') {
    return new ApiError(429, message);
  }

  static internal(message = 'Internal Server Error') {
    return new ApiError(500, message, null, false);
  }
}

module.exports = ApiError;
