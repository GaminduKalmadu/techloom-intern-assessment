const Reservation = require('../models/reservation.model');
const Product = require('../models/product.model');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Atomically reserve inventory items for an order
 * @param {string} orderId - Target order ID
 * @param {Array<{ productId: string, quantity: number }>} items - Items to reserve
 * @param {number} ttlMinutes - Expiration window in minutes
 */
const createReservations = async (orderId, items, ttlMinutes = env.RESERVATION_TTL_MINUTES) => {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  const reservedRecords = [];
  const successfulReservations = [];

  try {
    // Process reservations sequentially to maintain atomic rollback on failure
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
        throw ApiError.badRequest(
          `Insufficient stock available for '${name}'. Requested: ${quantity}, Available: ${
            prod ? prod.stockQuantity : 0
          }`
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
    // Rollback any successfully decremented items if one fails
    logger.warn(`Reservation failed for order ${orderId}. Rolling back held inventory...`);

    for (const item of successfulReservations) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: item.quantity },
      });
    }

    // Mark any created reservation docs as released
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
 * Confirm all reservations for an order upon successful payment
 */
const confirmReservations = async (orderId) => {
  const result = await Reservation.updateMany(
    { orderId, status: 'reserved' },
    { status: 'confirmed' }
  );
  return result;
};

/**
 * Release reserved inventory back into stock (e.g. order cancelled or expired)
 */
const releaseReservations = async (orderId) => {
  const activeReservations = await Reservation.find({
    orderId,
    status: 'reserved',
  });

  for (const res of activeReservations) {
    // Restore product stock quantity
    await Product.findByIdAndUpdate(res.productId, {
      $inc: { stockQuantity: res.quantity },
    });

    res.status = 'released';
    await res.save();
  }

  return activeReservations.length;
};

/**
 * Sweeper to release any reservations that passed their expiresAt timestamp
 */
const cleanupExpiredReservations = async () => {
  const now = new Date();
  const expired = await Reservation.find({
    status: 'reserved',
    expiresAt: { $lte: now },
  });

  let releasedCount = 0;
  for (const res of expired) {
    await Product.findByIdAndUpdate(res.productId, {
      $inc: { stockQuantity: res.quantity },
    });
    res.status = 'expired';
    await res.save();
    releasedCount++;
  }

  if (releasedCount > 0) {
    logger.info(`Cleaned up ${releasedCount} expired inventory reservations`);
  }

  return releasedCount;
};

module.exports = {
  createReservations,
  confirmReservations,
  releaseReservations,
  cleanupExpiredReservations,
};
