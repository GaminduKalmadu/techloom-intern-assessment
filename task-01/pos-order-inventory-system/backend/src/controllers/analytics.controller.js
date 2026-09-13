const analyticsService = require('../services/analytics.service');
const ApiResponse = require('../utils/apiResponse');

/**
 * GET /api/v1/analytics/dashboard
 * Query params: timeframe = 'today' | '7d' | '30d' | 'all'
 */
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const timeframe = req.query.timeframe || '7d';
    const data = await analyticsService.getDashboardAnalytics(timeframe);
    return ApiResponse.success(res, 'Dashboard analytics retrieved successfully', data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardAnalytics,
};
