const mongoose = require('mongoose');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Get authenticated customer's order history sorted newest first
 * GET /api/orders/my-orders
 */
const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Fetch authenticated customer's orders sorted newest first
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // 2. Lookup payments to attach transaction references if paid
    const orderIds = orders.map((o) => o._id);
    const payments = await Payment.find({ orderId: { $in: orderIds } }).lean();
    const paymentMap = new Map();
    for (const p of payments) {
      // If multiple payments exist (e.g. retry), prefer SUCCESS
      if (!paymentMap.has(p.orderId.toString()) || p.status === 'SUCCESS') {
        paymentMap.set(p.orderId.toString(), p);
      }
    }

    const formattedOrders = orders.map((order) => {
      const payment = paymentMap.get(order._id.toString());
      return {
        ...order,
        transactionReference: payment?.transactionReference || null,
        paymentId: payment?._id || null,
      };
    });

    return ApiResponse.success(res, 'Order history retrieved successfully', {
      orders: formattedOrders,
      count: formattedOrders.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed information for a specific order
 * GET /api/orders/:id
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid order ID format');
    }

    const order = await Order.findById(id).lean();
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // Security: Customer must only access their own orders
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      throw ApiError.forbidden('You are not authorized to view another customer\'s order');
    }

    // Retrieve linked payment and reservation
    const [payment, reservation] = await Promise.all([
      Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 }).lean(),
      Reservation.findOne({ orderId: order._id }).sort({ createdAt: -1 }).lean(),
    ]);

    return ApiResponse.success(res, 'Order details retrieved successfully', {
      order: {
        ...order,
        transactionReference: payment?.transactionReference || null,
      },
      payment: payment || null,
      reservation: reservation || null,
      transactionReference: payment?.transactionReference || null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyOrders,
  getOrderById,
};
