const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

/**
 * Middleware that checks if express-validator found any errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));
    return next(new ApiError(400, 'Validation failed for request data', formattedErrors));
  }
  next();
};

module.exports = validate;
