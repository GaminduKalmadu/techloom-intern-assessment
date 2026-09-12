const crypto = require('crypto');
const Payment = require('../models/payment.model');
const Order = require('../models/order.model');
const reservationService = require('./reservation.service');
const ApiError = require('../utils/apiError');

/**
 * Generate unique transaction reference (e.g. TXN-HEX-12)
 */
const generateTransactionId = () => {
  return `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};

/**
 * Process a payment for an existing order
 * @param {object} params
 * @param {string} params.orderId - Target order ID
 * @param {number} params.amount - Payment amount to capture
 * @param {string} params.paymentMethod - 'cash' | 'card' | 'digital_wallet'
 * @param {string} [params.transactionId] - Optional external gateway reference
 * @param {object} [params.metadata] - Optional supplementary payment metadata
 */
const processPayment = async ({
  orderId,
  amount,
  paymentMethod = 'cash',
  transactionId = null,
  metadata = {},
}) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw ApiError.notFound(`Order not found with ID ${orderId}`);
  }

  if (order.status === 'paid' || order.paymentStatus === 'paid') {
    throw ApiError.conflict('Order has already been paid for');
  }

  if (['cancelled', 'refunded'].includes(order.status)) {
    throw ApiError.badRequest(`Cannot process payment for an order with status '${order.status}'`);
  }

  // Validate exact amount
  if (Math.abs(order.totalAmount - Number(amount)) > 0.001) {
    throw ApiError.badRequest(
      `Payment amount mismatch. Order total: $${order.totalAmount.toFixed(
        2
      )}, provided: $${Number(amount).toFixed(2)}`
    );
  }

  const finalTxnId = transactionId || generateTransactionId();

  // 1. Record payment transaction
  const payment = await Payment.create({
    orderId,
    transactionId: finalTxnId,
    amount: order.totalAmount,
    currency: 'USD',
    paymentMethod,
    status: 'completed',
    metadata,
  });

  // 2. Update Order status
  order.status = 'paid';
  order.paymentStatus = 'paid';
  await order.save();

  // 3. Confirm all inventory reservations (finalizing stock reduction)
  await reservationService.confirmReservations(orderId);

  return {
    payment,
    order,
  };
};

/**
 * Get payment by order ID
 */
const getPaymentByOrderId = async (orderId) => {
  const payment = await Payment.findOne({ orderId }).sort({ createdAt: -1 });
  if (!payment) {
    throw ApiError.notFound(`No payment records found for order ${orderId}`);
  }
  return payment;
};

/**
 * Get payment by transaction ID
 */
const getPaymentByTransactionId = async (transactionId) => {
  const payment = await Payment.findOne({ transactionId });
  if (!payment) {
    throw ApiError.notFound(`Payment not found with transaction ID ${transactionId}`);
  }
  return payment;
};

module.exports = {
  generateTransactionId,
  processPayment,
  getPaymentByOrderId,
  getPaymentByTransactionId,
};
