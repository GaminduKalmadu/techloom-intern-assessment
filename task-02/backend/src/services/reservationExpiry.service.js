const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Order = require('../models/Order');
const Product = require('../models/Product');

let expiryTimer = null;
let isProcessing = false;

/**
 * Scan database for ACTIVE reservations whose expiresAt is past,
 * and transactionally release reserved stock and update statuses.
 * Guaranteed to execute release only once per reservation.
 *
 * @returns {Promise<{ processedCount: number, releasedProductCount: number }>}
 */
const expireOverdueReservations = async () => {
  if (isProcessing) {
    return { processedCount: 0, releasedProductCount: 0 };
  }

  isProcessing = true;
  let processedCount = 0;
  let releasedProductCount = 0;

  try {
    const now = new Date();

    // Query for ACTIVE reservations that have passed their expiration timestamp
    const overdueReservations = await Reservation.find({
      status: 'ACTIVE',
      expiresAt: { $lte: now },
    }).lean();

    if (!overdueReservations || overdueReservations.length === 0) {
      isProcessing = false;
      return { processedCount: 0, releasedProductCount: 0 };
    }

    for (const reservation of overdueReservations) {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        // 1. Atomic claim: Transition status from ACTIVE -> EXPIRED
        // If another worker or request already transitioned this reservation, this returns null
        const claimed = await Reservation.findOneAndUpdate(
          { _id: reservation._id, status: 'ACTIVE' },
          { status: 'EXPIRED' },
          { session, new: true }
        );

        if (!claimed) {
          // Already claimed/expired by another execution
          await session.abortTransaction();
          continue;
        }

        // 2. Release reserved stock quantities atomically without modifying stockQuantity
        for (const item of claimed.items) {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { reservedQuantity: -item.quantity } },
            { session }
          );
          releasedProductCount += item.quantity;
        }

        // 3. Mark linked order as EXPIRED and paymentStatus as TIMEOUT
        await Order.findByIdAndUpdate(
          claimed.orderId,
          {
            status: 'EXPIRED',
            paymentStatus: 'TIMEOUT',
          },
          { session }
        );

        // Commit transaction
        await session.commitTransaction();
        processedCount += 1;
        console.log(
          `[Reservation Expiry] Successfully expired reservation ${claimed._id} for order ${claimed.orderId}. Released ${claimed.items.length} product lines.`
        );
      } catch (err) {
        await session.abortTransaction();
        console.error(
          `[Reservation Expiry] Failed transaction for reservation ${reservation._id}:`,
          err.message
        );
      } finally {
        session.endSession();
      }
    }
  } catch (error) {
    console.error('[Reservation Expiry Error]', error.message);
  } finally {
    isProcessing = false;
  }

  return { processedCount, releasedProductCount };
};

/**
 * Start background reservation expiry worker.
 * Checks for expired reservations periodically (default: every 15 seconds).
 *
 * @param {number} intervalMs - Polling interval in milliseconds
 */
const startReservationExpiryWorker = (intervalMs = 15000) => {
  if (expiryTimer) return;

  console.log(`[Reservation Expiry] Background worker started (interval: ${intervalMs}ms)`);
  // Run once immediately on start
  expireOverdueReservations().catch((err) =>
    console.error('[Reservation Expiry] Initial check failed:', err.message)
  );

  expiryTimer = setInterval(() => {
    expireOverdueReservations().catch((err) =>
      console.error('[Reservation Expiry] Periodic check failed:', err.message)
    );
  }, intervalMs);

  // Prevent background interval from hanging test processes or CLI commands if unref'd
  if (expiryTimer && typeof expiryTimer.unref === 'function') {
    expiryTimer.unref();
  }
};

/**
 * Stop background worker gracefully
 */
const stopReservationExpiryWorker = () => {
  if (expiryTimer) {
    clearInterval(expiryTimer);
    expiryTimer = null;
    console.log('[Reservation Expiry] Background worker stopped');
  }
};

module.exports = {
  expireOverdueReservations,
  startReservationExpiryWorker,
  stopReservationExpiryWorker,
};
