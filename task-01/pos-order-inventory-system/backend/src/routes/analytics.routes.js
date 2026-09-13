const express = require('express');
const analyticsController = require('../controllers/analytics.controller');

const router = express.Router();

// GET /api/v1/analytics/dashboard
router.get('/dashboard', analyticsController.getDashboardAnalytics);

module.exports = router;
