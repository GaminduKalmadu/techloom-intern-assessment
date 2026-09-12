const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const ApiError = require('../utils/apiError');

/**
 * Global API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many requests from this IP, please try again after 15 minutes'));
  },
});

/**
 * Stricter rate limiter for authentication routes (login, register)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many authentication attempts, please try again after 15 minutes'));
  },
});

/**
 * Rate limiter for checkout / order placement to prevent automated race-condition spamming
 */
const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 orders per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Checkout rate limit exceeded. Please wait a moment before trying again.'));
  },
});

/**
 * Rate limiter for payment attempts to prevent brute force and duplicate billing
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 payment operations per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Payment processing rate limit exceeded. Please verify transaction status.'));
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  checkoutLimiter,
  paymentLimiter,
};
