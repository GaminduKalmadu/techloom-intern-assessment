const mongoose = require('mongoose');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation');
const Product = require('../models/Product');
const Refund = require('../models/Refund');
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

    // 2. Lookup payments and refunds to attach references
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

    const formattedOrders = orders.map((order) => {
      const payment = paymentMap.get(order._id.toString());
      const refund = refundMap.get(order._id.toString());
      return {
        ...order,
        transactionReference: payment?.transactionReference || null,
        paymentId: payment?._id || null,
        refundReference: refund?.refundReference || null,
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

    // Retrieve linked payment, reservation, and refund
    const [payment, reservation, refund] = await Promise.all([
      Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 }).lean(),
      Reservation.findOne({ orderId: order._id }).sort({ createdAt: -1 }).lean(),
      Refund.findOne({ orderId: order._id, status: 'SUCCESS' }).lean(),
    ]);

    return ApiResponse.success(res, 'Order details retrieved successfully', {
      order: {
        ...order,
        transactionReference: payment?.transactionReference || null,
        refundReference: refund?.refundReference || null,
      },
      payment: payment || null,
      reservation: reservation || null,
      refund: refund || null,
      transactionReference: payment?.transactionReference || null,
      refundReference: refund?.refundReference || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a confirmed paid order and simulate a refund
 * POST /api/orders/:id/cancel
 */
const cancelOrder = async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(ApiError.badRequest('Invalid order ID format'));
  }

  // 1. Locate and validate order
  const order = await Order.findById(id);
  if (!order) {
    return next(ApiError.notFound('Order not found'));
  }

  // 2. Validate customer ownership
  if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
    return next(ApiError.forbidden('You are not authorized to cancel this order'));
  }

  // 3. Prevent repeat / duplicate cancellation
  if (order.status === 'CANCELLED' || order.paymentStatus === 'REFUNDED') {
    return next(ApiError.badRequest('Order has already been cancelled and refunded'));
  }

  // 4. Validate order eligibility (must be CONFIRMED and SUCCESS)
  if (order.status !== 'CONFIRMED' || order.paymentStatus !== 'SUCCESS') {
    return next(
      ApiError.badRequest(
        `Order is not eligible for cancellation. Only paid confirmed orders can be cancelled (current status: ${order.status}, payment: ${order.paymentStatus})`
      )
    );
  }

  // 5. Locate successful payment
  const payment = await Payment.findOne({
    orderId: order._id,
    status: 'SUCCESS',
  });

  if (!payment) {
    return next(ApiError.badRequest('No successful payment record found for this order to refund'));
  }

  // 6. Check for existing refund to prevent double refund
  const existingRefund = await Refund.findOne({
    orderId: order._id,
    status: 'SUCCESS',
  });
  if (existingRefund) {
    return next(ApiError.badRequest('A refund has already been processed for this order'));
  }

  // 7. Execute MongoDB Transaction for ACID guarantees and duplicate prevention
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Atomic conditional claim: ensure order is still CONFIRMED and SUCCESS
    const claimedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        status: 'CONFIRMED',
        paymentStatus: 'SUCCESS',
      },
      {
        $set: {
          status: 'CANCELLED',
          paymentStatus: 'REFUNDED',
        },
      },
      { session, new: true }
    );

    if (!claimedOrder) {
      await session.abortTransaction();
      return next(ApiError.badRequest('Order has already been cancelled or is no longer eligible'));
    }

    // 8. Restore stockQuantity for each item in order
    // Rule: stockQuantity += quantity. Do not change reservedQuantity for already confirmed/sold stock.
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: { stockQuantity: item.quantity },
        },
        { session }
      );
    }

    // 9. Generate unique refundReference
    const refundReference = `REF_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // 10. Create Refund with status PENDING
    const [refund] = await Refund.create(
      [
        {
          orderId: order._id,
          paymentId: payment._id,
          userId: order.userId,
          amount: order.total,
          status: 'PENDING',
          refundReference,
        },
      ],
      { session }
    );

    // 11. Simulate successful refund: Refund -> SUCCESS
    refund.status = 'SUCCESS';
    await refund.save({ session });

    // 12. Payment -> REFUNDED
    await Payment.findByIdAndUpdate(
      payment._id,
      {
        $set: { status: 'REFUNDED' },
      },
      { session }
    );

    // 13. Commit Transaction
    await session.commitTransaction();

    return ApiResponse.success(res, 'Order cancelled and simulated refund processed successfully', {
      orderId: claimedOrder._id,
      orderStatus: claimedOrder.status,
      paymentStatus: claimedOrder.paymentStatus,
      refundReference: refund.refundReference,
      refundAmount: refund.amount,
      refundId: refund._id,
      order: claimedOrder,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

module.exports = {
  getMyOrders,
  getOrderById,
  cancelOrder,
};
