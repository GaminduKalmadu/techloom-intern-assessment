const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Process mock payment with concurrency safety, idempotency, and inventory adjustment
 * POST /api/payments
 */
const processPayment = async (req, res, next) => {
  const {
    orderId,
    idempotencyKey,
    cardNumber,
    cardholderName,
    expiryDate,
    cvv,
  } = req.body;

  // 1. Basic validation
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    return next(ApiError.badRequest('Valid order ID is required'));
  }

  if (!idempotencyKey || typeof idempotencyKey !== 'string' || !idempotencyKey.trim()) {
    return next(ApiError.badRequest('Valid idempotencyKey is required'));
  }

  const userId = req.user._id;

  // 2. Check existing payment for this idempotencyKey
  const existingPayment = await Payment.findOne({ idempotencyKey: idempotencyKey.trim() });
  if (existingPayment) {
    const existingOrder = await Order.findById(existingPayment.orderId);
    if (existingPayment.status === 'SUCCESS' || existingOrder?.status === 'CONFIRMED') {
      return res.status(200).json({
        success: true,
        message: 'This order has already been paid',
        data: {
          paymentId: existingPayment._id,
          orderId: existingPayment.orderId,
          status: existingPayment.status,
          transactionReference: existingPayment.transactionReference,
          amount: existingPayment.amount,
        },
      });
    }

    return res.status(200).json({
      success: existingPayment.status === 'SUCCESS',
      message: `Payment request previously processed with status: ${existingPayment.status}`,
      data: {
        paymentId: existingPayment._id,
        orderId: existingPayment.orderId,
        status: existingPayment.status,
        transactionReference: existingPayment.transactionReference,
        amount: existingPayment.amount,
      },
    });
  }

  // 3. Load Order and verify ownership & status
  const order = await Order.findById(orderId);
  if (!order) {
    return next(ApiError.notFound('Order not found'));
  }

  if (order.userId.toString() !== userId.toString() && req.user.role !== 'ADMIN') {
    return next(ApiError.forbidden('You are not authorized to pay for another customer\'s order'));
  }

  // If already paid: return safe response
  if (order.status === 'CONFIRMED' || order.paymentStatus === 'SUCCESS') {
    return res.status(200).json({
      success: true,
      message: 'This order has already been paid',
      data: {
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
    });
  }

  if (order.status !== 'RESERVED') {
    return next(
      ApiError.badRequest(`Order cannot be paid in status "${order.status}". Only RESERVED orders can be paid.`)
    );
  }

  // 4. Verify linked reservation
  const reservation = await Reservation.findOne({ orderId: order._id }).sort({ createdAt: -1 });
  if (!reservation) {
    return next(ApiError.badRequest('No reservation found for this order.'));
  }

  if (reservation.status !== 'ACTIVE') {
    return next(
      ApiError.badRequest(
        `Reservation is no longer active (status: "${reservation.status}"). Cannot process payment.`
      )
    );
  }

  const now = new Date();
  if (new Date(reservation.expiresAt) <= now) {
    return next(
      ApiError.conflict('Reservation has expired. Reserved inventory was released back to the catalog.')
    );
  }

  // 5. Determine mock outcome based on test card rules
  const cleanCard = (cardNumber || '').toString().replace(/[\s-]/g, '');
  let outcome = 'SUCCESS';

  if (cleanCard === '4000000000000002') {
    outcome = 'FAILED';
  } else if (cleanCard === '4000000000009995') {
    outcome = 'TIMEOUT';
  }

  // 6. Execute atomic transaction
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Atomic claim: check that order is still RESERVED in this transaction
    const claimedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        userId,
        status: 'RESERVED',
      },
      {
        $set: {
          status: outcome === 'SUCCESS' ? 'CONFIRMED' : outcome === 'FAILED' ? 'FAILED' : 'EXPIRED',
          paymentStatus: outcome === 'SUCCESS' ? 'SUCCESS' : outcome === 'FAILED' ? 'FAILED' : 'TIMEOUT',
        },
      },
      { session, new: true }
    );

    if (!claimedOrder) {
      // Order was already updated concurrently (e.g. double-click)
      await session.abortTransaction();
      const freshOrder = await Order.findById(orderId);
      if (freshOrder?.status === 'CONFIRMED' || freshOrder?.paymentStatus === 'SUCCESS') {
        return res.status(200).json({
          success: true,
          message: 'This order has already been paid',
          data: {
            orderId: freshOrder._id,
            status: freshOrder.status,
            paymentStatus: freshOrder.paymentStatus,
          },
        });
      }

      return next(ApiError.conflict('Order is currently being processed or is no longer in RESERVED status.'));
    }

    // ----------------------------------------------------
    // SUCCESS Outcome
    // ----------------------------------------------------
    if (outcome === 'SUCCESS') {
      const transactionReference = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      // 1. Create Payment record
      const [payment] = await Payment.create(
        [
          {
            orderId: order._id,
            userId,
            amount: order.total,
            status: 'SUCCESS',
            idempotencyKey: idempotencyKey.trim(),
            transactionReference,
          },
        ],
        { session }
      );

      // 2. Reservation -> COMPLETED
      await Reservation.findByIdAndUpdate(
        reservation._id,
        { status: 'COMPLETED' },
        { session }
      );

      // 3. For each product: stockQuantity -= quantity, reservedQuantity -= quantity
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: {
              stockQuantity: -item.quantity,
              reservedQuantity: -item.quantity,
            },
          },
          { session }
        );
      }

      // 4. Cart -> COMPLETED
      await Cart.findOneAndUpdate(
        { userId, status: { $in: ['CHECKOUT', 'ACTIVE'] } },
        { status: 'COMPLETED' },
        { session }
      );

      await session.commitTransaction();

      return ApiResponse.success(
        res,
        'Payment processed successfully. Order confirmed.',
        {
          paymentId: payment._id,
          orderId: order._id,
          status: 'SUCCESS',
          transactionReference,
          amount: payment.amount,
        },
        200
      );
    }

    // ----------------------------------------------------
    // FAILED Outcome
    // ----------------------------------------------------
    if (outcome === 'FAILED') {
      // 1. Create Payment record with FAILED
      const [payment] = await Payment.create(
        [
          {
            orderId: order._id,
            userId,
            amount: order.total,
            status: 'FAILED',
            idempotencyKey: idempotencyKey.trim(),
            transactionReference: null,
          },
        ],
        { session }
      );

      // 2. Reservation -> RELEASED
      await Reservation.findByIdAndUpdate(
        reservation._id,
        { status: 'RELEASED' },
        { session }
      );

      // 3. For each product: reservedQuantity -= quantity (stockQuantity stays unchanged)
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: {
              reservedQuantity: -item.quantity,
            },
          },
          { session }
        );
      }

      await session.commitTransaction();

      return res.status(200).json({
        success: false,
        message: 'Payment failed. Card was declined.',
        data: {
          paymentId: payment._id,
          orderId: order._id,
          status: 'FAILED',
          amount: payment.amount,
        },
      });
    }

    // ----------------------------------------------------
    // TIMEOUT Outcome
    // ----------------------------------------------------
    if (outcome === 'TIMEOUT') {
      // 1. Create Payment record with TIMEOUT
      const [payment] = await Payment.create(
        [
          {
            orderId: order._id,
            userId,
            amount: order.total,
            status: 'TIMEOUT',
            idempotencyKey: idempotencyKey.trim(),
            transactionReference: null,
          },
        ],
        { session }
      );

      // 2. Reservation -> EXPIRED
      await Reservation.findByIdAndUpdate(
        reservation._id,
        { status: 'EXPIRED' },
        { session }
      );

      // 3. For each product: release reserved stock: reservedQuantity -= quantity (stockQuantity untouched)
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: {
              reservedQuantity: -item.quantity,
            },
          },
          { session }
        );
      }

      await session.commitTransaction();

      return res.status(200).json({
        success: false,
        message: 'Payment timed out. Stock reservation has expired.',
        data: {
          paymentId: payment._id,
          orderId: order._id,
          status: 'TIMEOUT',
          amount: payment.amount,
        },
      });
    }
  } catch (error) {
    await session.abortTransaction();

    // Catch duplicate idempotencyKey race at DB engine level
    if (error.code === 11000 && error.keyPattern?.idempotencyKey) {
      const existing = await Payment.findOne({ idempotencyKey: idempotencyKey.trim() });
      if (existing?.status === 'SUCCESS') {
        return res.status(200).json({
          success: true,
          message: 'This order has already been paid',
          data: {
            paymentId: existing._id,
            orderId: existing.orderId,
            status: existing.status,
            transactionReference: existing.transactionReference,
          },
        });
      }
      return res.status(200).json({
        success: false,
        message: 'Duplicate payment request detected.',
        data: existing,
      });
    }

    // Catch concurrent transaction write conflicts (e.g. rapid double-clicks)
    const isConflict =
      error.code === 112 ||
      error.errorLabels?.includes('TransientTransactionError') ||
      error.hasErrorLabel?.('TransientTransactionError') ||
      (typeof error.message === 'string' && error.message.includes('WriteConflict'));

    if (isConflict) {
      // Brief jitter to allow winning concurrent transaction to commit
      await new Promise((r) => setTimeout(r, 100));
      const currentOrder = await Order.findById(orderId);
      if (currentOrder?.status === 'CONFIRMED' || currentOrder?.paymentStatus === 'SUCCESS') {
        return res.status(200).json({
          success: true,
          message: 'This order has already been paid',
          data: {
            orderId: currentOrder._id,
            status: currentOrder.status,
            paymentStatus: currentOrder.paymentStatus,
          },
        });
      }
      return res.status(200).json({
        success: true,
        message: 'This order has already been paid',
      });
    }

    next(error);
  } finally {
    session.endSession();
  }
};

/**
 * Get payment details for an order
 * GET /api/payments/order/:orderId
 */
const getPaymentByOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw ApiError.badRequest('Invalid order ID format');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      throw ApiError.forbidden('You are not authorized to view payments for this order');
    }

    const payment = await Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 });

    return ApiResponse.success(res, 'Payment retrieved', {
      order,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processPayment,
  getPaymentByOrder,
};
