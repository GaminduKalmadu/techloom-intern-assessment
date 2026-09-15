const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const Reservation = require('../models/Reservation');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Get aggregated administrative operational metrics
 * GET /api/admin/dashboard
 */
const getDashboardMetrics = async (req, res, next) => {
  try {
    // 1. Inventory Aggregations
    const productAgg = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stockQuantity' },
          totalReserved: { $sum: '$reservedQuantity' },
        },
      },
    ]);

    const totalProducts = productAgg[0]?.totalProducts || 0;
    const totalStock = productAgg[0]?.totalStock || 0;
    const reservedInventory = productAgg[0]?.totalReserved || 0;
    const availableInventory = Math.max(0, totalStock - reservedInventory);

    // 2. Orders & Revenue Aggregations
    const orderAgg = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          confirmedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'CONFIRMED'] }, 1, 0] },
          },
          failedOrders: {
            $sum: {
              $cond: [
                { $in: ['$status', ['FAILED', 'EXPIRED', 'CANCELLED']] },
                1,
                0,
              ],
            },
          },
          revenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'CONFIRMED'] },
                    { $eq: ['$paymentStatus', 'SUCCESS'] },
                  ],
                },
                '$total',
                0,
              ],
            },
          },
        },
      },
    ]);

    const totalOrders = orderAgg[0]?.totalOrders || 0;
    const confirmedOrders = orderAgg[0]?.confirmedOrders || 0;
    const failedOrders = orderAgg[0]?.failedOrders || 0;
    const revenue = orderAgg[0]?.revenue || 0;

    // 3. Refund Aggregations
    const refundAgg = await Refund.aggregate([
      {
        $match: { status: 'SUCCESS' },
      },
      {
        $group: {
          _id: null,
          refundedAmount: { $sum: '$amount' },
          totalRefunds: { $sum: 1 },
        },
      },
    ]);

    const refundedAmount = refundAgg[0]?.refundedAmount || 0;
    const totalRefunds = refundAgg[0]?.totalRefunds || 0;

    // 4. Quick Recent Orders (5 newest)
    const recentOrders = await Order.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return ApiResponse.success(res, 'Admin dashboard metrics retrieved successfully', {
      metrics: {
        totalProducts,
        availableInventory,
        reservedInventory,
        totalOrders,
        confirmedOrders,
        failedOrders,
        revenue: Number(revenue.toFixed(2)),
        refundedAmount: Number(refundedAmount.toFixed(2)),
        totalRefunds,
      },
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all customer orders with filters and pagination
 * GET /api/admin/orders
 */
const getAdminOrders = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (orderStatus && orderStatus !== 'ALL') {
      query.status = orderStatus;
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      query.paymentStatus = paymentStatus;
    }

    // Search by MongoDB Order ID if valid
    if (search && search.trim()) {
      const term = search.trim();
      if (mongoose.Types.ObjectId.isValid(term)) {
        query._id = term;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(query),
    ]);

    // Lookup payments and refunds for these orders to attach references
    const orderIds = orders.map((o) => o._id);
    const [payments, refunds] = await Promise.all([
      Payment.find({ orderId: { $in: orderIds } }).lean(),
      Refund.find({ orderId: { $in: orderIds }, status: 'SUCCESS' }).lean(),
    ]);

    const paymentMap = new Map();
    for (const p of payments) {
      if (!paymentMap.has(p.orderId.toString()) || p.status === 'SUCCESS' || p.status === 'REFUNDED') {
        paymentMap.set(p.orderId.toString(), p);
      }
    }

    const refundMap = new Map();
    for (const r of refunds) {
      refundMap.set(r.orderId.toString(), r);
    }

    const formattedOrders = orders.map((o) => {
      const p = paymentMap.get(o._id.toString());
      const r = refundMap.get(o._id.toString());
      return {
        ...o,
        customer: o.userId || { name: 'Anonymous', email: 'N/A' },
        transactionReference: p?.transactionReference || null,
        refundReference: r?.refundReference || null,
      };
    });

    return ApiResponse.success(res, 'Admin orders retrieved successfully', {
      orders: formattedOrders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get complete order details by ID for Admin
 * GET /api/admin/orders/:id
 */
const getAdminOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid order ID format');
    }

    const order = await Order.findById(id)
      .populate('userId', 'name email role createdAt')
      .lean();

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const [payment, reservation, refund] = await Promise.all([
      Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 }).lean(),
      Reservation.findOne({ orderId: order._id }).sort({ createdAt: -1 }).lean(),
      Refund.findOne({ orderId: order._id }).sort({ createdAt: -1 }).lean(),
    ]);

    return ApiResponse.success(res, 'Order details retrieved successfully', {
      order: {
        ...order,
        customer: order.userId || { name: 'Anonymous', email: 'N/A' },
        transactionReference: payment?.transactionReference || null,
        refundReference: refund?.refundReference || null,
      },
      payment: payment || null,
      reservation: reservation || null,
      refund: refund || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all payment records for Admin
 * GET /api/admin/payments
 */
const getAdminPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('userId', 'name email')
        .populate('orderId', 'total status paymentStatus createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Payment.countDocuments(query),
    ]);

    const formattedPayments = payments.map((p) => ({
      _id: p._id,
      transactionReference: p.transactionReference || 'N/A',
      amount: p.amount,
      status: p.status,
      idempotencyKey: p.idempotencyKey,
      createdAt: p.createdAt,
      order: p.orderId,
      customer: p.userId || { name: 'Anonymous', email: 'N/A' },
    }));

    return ApiResponse.success(res, 'Admin payments retrieved successfully', {
      payments: formattedPayments,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all refund records for Admin
 * GET /api/admin/refunds
 */
const getAdminRefunds = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [refunds, total] = await Promise.all([
      Refund.find(query)
        .populate('userId', 'name email')
        .populate('orderId', 'total status paymentStatus createdAt')
        .populate('paymentId', 'transactionReference amount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Refund.countDocuments(query),
    ]);

    const formattedRefunds = refunds.map((r) => ({
      _id: r._id,
      refundReference: r.refundReference || 'N/A',
      amount: r.amount,
      status: r.status,
      createdAt: r.createdAt,
      order: r.orderId,
      payment: r.paymentId,
      customer: r.userId || { name: 'Anonymous', email: 'N/A' },
    }));

    return ApiResponse.success(res, 'Admin refunds retrieved successfully', {
      refunds: formattedRefunds,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getAdminOrders,
  getAdminOrderById,
  getAdminPayments,
  getAdminRefunds,
};
