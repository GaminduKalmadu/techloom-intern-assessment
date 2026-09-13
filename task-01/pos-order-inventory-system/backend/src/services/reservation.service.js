const mongoose = require('mongoose');
const Reservation = require('../models/reservation.model');
const Product = require('../models/product.model');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Helper to execute reservations within a MongoDB session/transaction
 */
const _executeReservationWithSession = async (orderId, items, expiresAt, session) => {
  const reservedRecords = [];

  for (const item of items) {
    const { productId, quantity } = item;

    // 1. Atomically decrement stock only if available (stockQuantity >= quantity)
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: productId,
        stockQuantity: { $gte: quantity },
      },
      {
        $inc: { stockQuantity: -quantity },
      },
      { new: true, session }
    );

    if (!updatedProduct) {
      const prod = await Product.findById(productId).session(session);
      const name = prod ? prod.name : productId;
      const available = prod ? prod.stockQuantity : 0;
      throw ApiError.badRequest(
        `Insufficient stock available for '${name}'. Requested: ${quantity}, Available: ${available}`
      );
    }

    // 2. Create reservation document within session
    const [reservation] = await Reservation.create(
      [
        {
          orderId,
          productId,
          quantity,
          expiresAt,
          status: 'reserved',
        },
      ],
      { session }
    );

    reservedRecords.push(reservation);
  }

  return reservedRecords;
};

/**
 * Fallback executor using atomic findOneAndUpdate with manual compensation
 * Used if MongoDB is deployed without replica set (standalone local testing)
 */
const _executeReservationAtomicFallback = async (orderId, items, expiresAt) => {
  const reservedRecords = [];
  const successfulReservations = [];

  try {
    for (const item of items) {
      const { productId, quantity } = item;

      // 1. Atomically decrement stock only if available
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: productId,
          stockQuantity: { $gte: quantity },
        },
        {
          $inc: { stockQuantity: -quantity },
        },
        { new: true }
      );

      if (!updatedProduct) {
        const prod = await Product.findById(productId);
        const name = prod ? prod.name : productId;
        const available = prod ? prod.stockQuantity : 0;
        throw ApiError.badRequest(
          `Insufficient stock available for '${name}'. Requested: ${quantity}, Available: ${available}`
        );
      }

      successfulReservations.push({ productId, quantity });

      // 2. Create reservation document
      const reservation = await Reservation.create({
        orderId,
        productId,
        quantity,
        expiresAt,
        status: 'reserved',
      });

      reservedRecords.push(reservation);
    }

    return reservedRecords;
  } catch (error) {
    logger.warn(`Reservation fallback failed for order ${orderId}. Compensating held stock...`);

    for (const item of successfulReservations) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: item.quantity },
      });
    }

    if (reservedRecords.length > 0) {
      const reservationIds = reservedRecords.map((r) => r._id);
      await Reservation.updateMany(
        { _id: { $in: reservationIds } },
        { status: 'released' }
      );
    }

    throw error;
  }
};

/**
 * Atomically reserve inventory items for an order
 * Uses MongoDB Transactions when available, with atomic findOneAndUpdate guards.
 *
 * @param {string|mongoose.Types.ObjectId} orderId - Target order ID
 * @param {Array<{ productId: string, quantity: number }>} items - Items to reserve
 * @param {number} [ttlMinutes] - Expiration window in minutes (default: 5 min)
 * @param {mongoose.ClientSession} [externalSession] - Optional external session
 * @returns {Promise<Array<Reservation>>}
 */
const createReservations = async (
  orderId,
  items,
  ttlMinutes = env.RESERVATION_TTL_MINUTES,
  externalSession = null
) => {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  // If caller passed an active session, use it directly
  if (externalSession) {
    return await _executeReservationWithSession(orderId, items, expiresAt, externalSession);
  }

  // Under high concurrency (e.g. 100 users hitting the same product document simultaneously),
  // MongoDB snapshot isolation detects concurrent document writes and throws WriteConflict
  // (labeled as TransientTransactionError). We retry with jittered backoff.
  const maxRetries = 25;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let session = null;
    try {
      session = await mongoose.startSession();
      let reservedRecords = null;

      await session.withTransaction(
        async () => {
          reservedRecords = await _executeReservationWithSession(
            orderId,
            items,
            expiresAt,
            session
          );
        },
        {
          readPreference: 'primary',
          readConcern: { level: 'local' },
          writeConcern: { w: 'majority' },
        }
      );

      return reservedRecords;
    } catch (error) {
      // Check if error is TransientTransactionError or WriteConflict
      const isTransient =
        (error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError')) ||
        (error.message && error.message.includes('Write conflict')) ||
        (error.message && error.message.includes('WriteConflict'));

      if (isTransient && attempt < maxRetries) {
        // Jittered backoff (15ms - 60ms) to desynchronize concurrent threads
        const delay = Math.floor(Math.random() * 40) + 15;
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }

      // Check if error is due to MongoDB running as standalone (no replica set configured)
      const isNoReplicaSet =
        error.message &&
        (error.message.includes('Transaction numbers are only allowed on a replica set member or mongos') ||
          error.message.includes('This MongoDB deployment does not support retryable writes'));

      if (isNoReplicaSet) {
        logger.warn(
          'MongoDB transactions unsupported on standalone instance. Falling back to atomic findOneAndUpdate with rollback.'
        );
        return await _executeReservationAtomicFallback(orderId, items, expiresAt);
      }

      throw error;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }
};

/**
 * Confirm all reservations for an order upon successful payment
 */
const confirmReservations = async (orderId) => {
  const result = await Reservation.updateMany(
    { orderId, status: 'reserved' },
    { $set: { status: 'confirmed' } }
  );
  return result;
};

/**
 * Release reserved inventory back into stock (e.g. order cancelled or abandoned)
 */
const releaseReservations = async (orderId) => {
  const activeReservations = await Reservation.find({
    orderId,
    status: 'reserved',
  });

  let releasedCount = 0;
  for (const res of activeReservations) {
    // Atomic CAS to prevent duplicate releases
    const transitioned = await Reservation.findOneAndUpdate(
      { _id: res._id, status: 'reserved' },
      { $set: { status: 'released' } },
      { new: true }
    );

    if (transitioned) {
      await Product.findByIdAndUpdate(res.productId, {
        $inc: { stockQuantity: res.quantity },
      });
      releasedCount++;
    }
  }

  return releasedCount;
};

/**
 * Background sweeper to find expired reservations and safely restore stock.
 * Runs every minute via node-cron.
 *
 * Guaranteed concurrency-safe and idempotent:
 * - Uses atomic findOneAndUpdate on the reservation to lock it into 'expired' status.
 * - Safely restores stock via $inc on Product.
 * - Uses the payment transaction to update Payment, Order, Reservation, and Product together.
 *
 * @returns {Promise<{ releasedReservations: number, restoredStockCount: number, expiredOrders: number }>}
 */
const cleanupExpiredReservations = async () => {
  const now = new Date();
  const expiredCandidates = await Reservation.find({
    status: { $in: ['reserved', 'ACTIVE'] },
    expiresAt: { $lte: now },
  }).lean();

  if (!expiredCandidates || expiredCandidates.length === 0) {
    return { releasedReservations: 0, restoredStockCount: 0, expiredOrders: 0 };
  }

  const paymentService = require('./payment.service');
  const grouped = new Map();
  for (const reservation of expiredCandidates) {
    const key = reservation.orderId.toString();
    const current = grouped.get(key) || { reservations: 0, stock: 0 };
    current.reservations += 1;
    current.stock += reservation.quantity;
    grouped.set(key, current);
  }

  let releasedReservations = 0;
  let restoredStockCount = 0;
  let expiredOrders = 0;
  for (const [orderId, totals] of grouped) {
    try {
      const result = await paymentService.processPayment({
        orderId,
        paymentMethod: 'CARD',
        idempotencyKey: `reservation-timeout:${orderId}`,
      });
      if (result.paymentStatus === 'TIMEOUT') {
        releasedReservations += totals.reservations;
        restoredStockCount += totals.stock;
        expiredOrders += 1;
      }
    } catch (error) {
      if (![409, 404].includes(error.statusCode)) throw error;
    }
  }

  if (releasedReservations > 0) {
    logger.info(
      `[Reservation Sweeper] Released ${releasedReservations} reservation(s), restored ${restoredStockCount} stock unit(s), marked ${expiredOrders} order(s) as EXPIRED`
    );
  }

  return { releasedReservations, restoredStockCount, expiredOrders };
};

/**
 * Get reservations for an order
 */
const getReservationsByOrderId = async (orderId) => {
  return await Reservation.find({ orderId }).populate('productId', 'name price stockQuantity');
};

module.exports = {
  createReservations,
  confirmReservations,
  releaseReservations,
  cleanupExpiredReservations,
  getReservationsByOrderId,
};
