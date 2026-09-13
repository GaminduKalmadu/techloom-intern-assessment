const crypto = require('crypto');
const mongoose = require('mongoose');
const Payment = require('../models/payment.model');
const Order = require('../models/order.model');
const Reservation = require('../models/reservation.model');
const Product = require('../models/product.model');
const mockPaymentService = require('./mockPayment.service');
const ApiError = require('../utils/apiError');

const ACTIVE_RESERVATION_STATUSES = ['reserved', 'ACTIVE'];
const generateTransactionId = () =>
  `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

const paymentMessage = (status) => ({
  SUCCESS: 'Payment completed successfully',
  FAILED: "We couldn't complete your payment. Your reserved stock has been released.",
  TIMEOUT: 'Your reservation has expired. The reserved stock has been released.',
}[status]);

const formatResult = (payment, order, replayed = false) => ({
  success: payment.status === 'SUCCESS',
  paymentStatus: payment.status,
  orderStatus: order.status,
  message: paymentMessage(payment.status),
  transactionId: payment.transactionId,
  amount: payment.amount,
  currency: payment.currency,
  order,
  payment,
  replayed,
});

const getIdempotentResult = async (idempotencyKey) => {
  const payment = await Payment.findOne({ idempotencyKey });
  if (!payment) return null;
  const order = await Order.findById(payment.orderId);
  return formatResult(payment, order, true);
};

const releaseStock = async (orderId, targetStatus, session) => {
  const reservations = await Reservation.find({
    orderId,
    status: { $in: ACTIVE_RESERVATION_STATUSES },
  }).session(session);

  for (const reservation of reservations) {
    const transitioned = await Reservation.findOneAndUpdate(
      { _id: reservation._id, status: { $in: ACTIVE_RESERVATION_STATUSES } },
      { $set: { status: targetStatus } },
      { new: true, session }
    );
    if (transitioned) {
      await Product.findByIdAndUpdate(
        reservation.productId,
        { $inc: { stockQuantity: reservation.quantity } },
        { session }
      );
    }
  }
};

const processPayment = async ({ orderId, paymentMethod = 'CARD', simulationOutcome, idempotencyKey }) => {
  const replay = await getIdempotentResult(idempotencyKey);
  if (replay) {
    if (replay.payment.orderId.toString() !== orderId.toString()) {
      throw ApiError.coded(409, 'IDEMPOTENCY_KEY_REUSED', 'This idempotency key belongs to another order.');
    }
    return replay;
  }

  const requestedOutcome = mockPaymentService.processPayment({ simulationOutcome });
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw ApiError.coded(404, 'ORDER_NOT_FOUND', 'Order not found.');

      const successfulPayment = await Payment.findOne({ orderId, status: 'SUCCESS' }).session(session);
      if (successfulPayment || order.status === 'PAID') {
        throw ApiError.coded(409, 'PAYMENT_ALREADY_PROCESSED', 'Payment has already been completed for this order.');
      }
      if (order.status !== 'RESERVED') {
        throw ApiError.coded(409, 'INVALID_ORDER_STATE', `Payment cannot be processed for an order with status ${order.status}.`);
      }

      const activeReservations = await Reservation.find({
        orderId,
        status: { $in: ACTIVE_RESERVATION_STATUSES },
      }).session(session);
      if (activeReservations.length === 0) {
        throw ApiError.coded(409, 'RESERVATION_NOT_ACTIVE', 'The order reservation is no longer active.');
      }

      const expiredAtBackend = activeReservations.some((reservation) => reservation.expiresAt <= new Date());
      const outcome = expiredAtBackend ? 'TIMEOUT' : requestedOutcome;
      const orderStatus = outcome === 'SUCCESS' ? 'PAID' : outcome === 'FAILED' ? 'FAILED' : 'EXPIRED';
      const transitionedOrder = await Order.findOneAndUpdate(
        { _id: orderId, status: 'RESERVED' },
        { $set: { status: orderStatus, paymentStatus: outcome === 'SUCCESS' ? 'paid' : 'failed' } },
        { new: true, session }
      );
      if (!transitionedOrder) {
        throw ApiError.coded(409, 'PAYMENT_IN_PROGRESS', 'Another payment attempt has already processed this order.');
      }

      if (outcome === 'SUCCESS') {
        await Reservation.updateMany(
          { orderId, status: { $in: ACTIVE_RESERVATION_STATUSES } },
          { $set: { status: 'confirmed' } },
          { session }
        );
      } else {
        await releaseStock(orderId, outcome === 'FAILED' ? 'released' : 'expired', session);
      }

      const [payment] = await Payment.create([{
        orderId,
        transactionId: generateTransactionId(),
        paymentMethod: paymentMethod.toUpperCase(),
        amount: order.totalAmount,
        currency: 'USD',
        status: outcome,
        idempotencyKey,
      }], { session });
      result = formatResult(payment, transitionedOrder);
    });
    return result;
  } catch (error) {
    if (error.code === 11000) {
      const existing = await getIdempotentResult(idempotencyKey);
      if (existing && existing.payment.orderId.toString() === orderId.toString()) return existing;
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

const getPaymentByOrderId = async (orderId) => {
  const payment = await Payment.findOne({ orderId }).sort({ createdAt: -1 });
  if (!payment) throw ApiError.coded(404, 'PAYMENT_NOT_FOUND', 'Payment not found.');
  return payment;
};

const getPayments = async ({ status, search, page = 1, limit = 20 } = {}) => {
  const query = {};
  if (status && status !== 'ALL') query.status = status.toUpperCase();
  if (search && search.trim()) {
    const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchingOrders = await Order.find({
      orderNumber: { $regex: safeSearch, $options: 'i' },
    }).select('_id').lean();
    query.$or = [
      { transactionId: { $regex: safeSearch, $options: 'i' } },
      { orderId: { $in: matchingOrders.map((order) => order._id) } },
      ...(mongoose.isValidObjectId(search.trim()) ? [{ orderId: search.trim() }] : []),
    ];
  }
  const numericPage = Math.max(1, Number(page) || 1);
  const numericLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const [payments, total] = await Promise.all([
    Payment.find(query).populate('orderId', 'orderNumber status totalAmount').sort({ createdAt: -1 })
      .skip((numericPage - 1) * numericLimit).limit(numericLimit).lean(),
    Payment.countDocuments(query),
  ]);
  return { payments, pagination: { total, page: numericPage, limit: numericLimit, totalPages: Math.ceil(total / numericLimit) } };
};

const getPaymentById = async (id) => {
  const payment = await Payment.findById(id).populate('orderId');
  if (!payment) throw ApiError.coded(404, 'PAYMENT_NOT_FOUND', 'Payment not found.');
  return payment;
};

module.exports = { generateTransactionId, processPayment, getPaymentByOrderId, getPayments, getPaymentById };
