const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const User = require('../models/user.model');

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await authService.registerUser({ name, email, password, role });
    return ApiResponse.created(res, 'User registered successfully', result);
  } catch (err) {
    next(err);
  }
};

/**
 * Authenticate existing user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    return ApiResponse.success(res, 'Authentication successful', result);
  } catch (err) {
    next(err);
  }
};

/**
 * Get current authenticated user profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return ApiResponse.success(res, 'User profile retrieved', { user });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
