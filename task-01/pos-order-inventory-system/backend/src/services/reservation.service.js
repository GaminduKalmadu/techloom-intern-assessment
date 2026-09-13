const mongoose = require('mongoose');
const Reservation = require('../models/reservation.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
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
 * - Updates the parent Order status to 'EXPIRED' / 'expired'.
 *
 * @returns {Promise<{ releasedReservations: number, restoredStockCount: number, expiredOrders: number }>}
 */
const cleanupExpiredReservations = async () => {
  const now = new Date();
  const expiredCandidates = await Reservation.find({
    status: 'reserved',
    expiresAt: { $lte: now },
  }).lean();

  if (!expiredCandidates || expiredCandidates.length === 0) {
    return { releasedReservations: 0, restoredStockCount: 0, expiredOrders: 0 };
  }

  let releasedReservations = 0;
  let restoredStockCount = 0;
  const affectedOrderIds = new Set();

  for (const res of expiredCandidates) {
    // Atomic Compare-And-Swap (CAS):
    // Only proceed if status is STILL 'reserved' at this exact millisecond
    const lockedRes = await Reservation.findOneAndUpdate(
      { _id: res._id, status: 'reserved' },
      { $set: { status: 'expired' } },
      { new: true }
    );

    if (!lockedRes) {
      // Another worker/cron run already acquired and handled this reservation
      continue;
    }

    releasedReservations++;
    restoredStockCount += res.quantity;

    // Atomically restore product stock quantity
    await Product.findByIdAndUpdate(res.productId, {
      $inc: { stockQuantity: res.quantity },
    });

    affectedOrderIds.add(res.orderId.toString());
  }

  // Update order status to 'EXPIRED' for all orders whose reservations expired
  let expiredOrders = 0;
  for (const orderId of affectedOrderIds) {
    const activeCount = await Reservation.countDocuments({
      orderId,
      status: 'reserved',
    });

    // If no active reservations remain for this order, mark it EXPIRED
    if (activeCount === 0) {
      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: orderId,
          status: { $in: ['RESERVED', 'PENDING', 'reserved', 'pending'] },
        },
        {
          $set: {
            status: 'EXPIRED',
            notes: '[Auto-expired: inventory reservation timed out after 5 minutes]',
          },
        },
        { new: true }
      );

      if (updatedOrder) {
        expiredOrders++;
      }
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
