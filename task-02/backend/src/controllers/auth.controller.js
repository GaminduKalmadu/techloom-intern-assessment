const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const env = require('../config/env');

/**
 * Generate signed JWT token
 * @param {Object} user 
 * @returns {string}
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
};

/**
 * @desc    Register a new customer account
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw ApiError.badRequest('Full name is required.');
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      throw ApiError.badRequest('Valid email address is required.');
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      throw ApiError.badRequest('Please enter a valid email format.');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      throw ApiError.badRequest('Password must be at least 6 characters long.');
    }

    // 2. Normalize email and check existing user
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      throw ApiError.conflict('An account with this email address already exists.');
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Create user (CRITICAL: role is strictly forced to CUSTOMER, public cannot register as ADMIN)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'CUSTOMER',
    });

    // 5. Generate token & respond
    const token = generateToken(user);

    return ApiResponse.success(
      res,
      'Registration successful. Welcome to Techloom Store!',
      {
        user,
        token,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required.');
    }

    // 2. Normalize and look up user with explicit passwordHash selection
    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    // 3. Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    // 4. Generate token & respond
    const token = generateToken(user);

    return ApiResponse.success(
      res,
      'Login successful.',
      {
        user,
        token,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user profile
 * @route   GET /api/auth/me
 * @access  Protected
 */
const getMe = async (req, res, next) => {
  try {
    return ApiResponse.success(
      res,
      'User profile retrieved successfully.',
      {
        user: req.user,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify admin role access
 * @route   GET /api/auth/admin-check
 * @access  Protected (Admin only)
 */
const adminCheck = async (req, res, next) => {
  try {
    return ApiResponse.success(
      res,
      'Admin authorization verified successfully.',
      {
        user: req.user,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  adminCheck,
};
