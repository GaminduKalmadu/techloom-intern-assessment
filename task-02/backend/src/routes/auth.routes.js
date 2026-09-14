const express = require('express');
const { register, login, getMe, adminCheck } = require('../controllers/auth.controller');
const { protect, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);

// Admin-protected verification route
router.get('/admin-check', protect, requireAdmin, adminCheck);

module.exports = router;
