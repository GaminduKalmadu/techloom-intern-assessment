const reservationService = require('../services/reservation.service');
const Reservation = require('../models/reservation.model');
const ApiResponse = require('../utils/apiResponse');

/**
 * List inventory reservations with status filter and pagination
 * GET /api/v1/reservations
 */
const getReservations = async (req, res, next) => {
  try {
    const { status, orderId, productId, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (orderId) query.orderId = orderId;
    if (productId) query.productId = productId;

    const numericPage = Math.max(1, parseInt(page, 10));
    const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (numericPage - 1) * numericLimit;

    const [reservations, total] = await Promise.all([
      Reservation.find(query)
        .populate('productId', 'name price stockQuantity')
        .populate('orderId', 'orderNumber status totalAmount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      Reservation.countDocuments(query),
    ]);

    return ApiResponse.success(
      res,
      'Reservations retrieved successfully',
      reservations,
      200,
      {
        total,
        page: numericPage,
        limit: numericLimit,
        totalPages: Math.ceil(total / numericLimit),
      }
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Trigger manual cleanup of expired reservations
 * POST /api/v1/reservations/cleanup
 */
const triggerCleanup = async (req, res, next) => {
  try {
    const result = await reservationService.cleanupExpiredReservations();
    return ApiResponse.success(res, 'Expired reservations cleanup completed', result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReservations,
  triggerCleanup,
};
