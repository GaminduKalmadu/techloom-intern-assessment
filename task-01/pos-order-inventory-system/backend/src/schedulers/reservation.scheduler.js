const cron = require('node-cron');
const reservationService = require('../services/reservation.service');
const logger = require('../utils/logger');

let cronTask = null;
let isJobRunning = false;

/**
 * Start the background scheduler for inventory reservation cleanup.
 * Runs every minute to find expired reservations, safely release held stock,
 * and transition reservation and order statuses to 'expired'.
 *
 * @param {string} [cronExpression='* * * * *'] - Standard 5-field cron pattern (default: every minute)
 */
const startReservationScheduler = (cronExpression = '* * * * *') => {
  if (cronTask) {
    logger.warn('Reservation cleanup scheduler is already running.');
    return;
  }

  logger.info(`Initializing reservation cleanup scheduler [cron: '${cronExpression}']`);

  cronTask = cron.schedule(
    cronExpression,
    async () => {
      // Prevent overlapping runs if previous run took longer than 1 minute
      if (isJobRunning) {
        logger.warn('Previous reservation cleanup is still in progress, skipping this tick.');
        return;
      }

      isJobRunning = true;
      try {
        const result = await reservationService.cleanupExpiredReservations();
        if (result.releasedReservations > 0) {
          logger.info(
            `[Cron Task] Successfully swept expired reservations: ${result.releasedReservations} released, ${result.restoredStockCount} units restored, ${result.expiredOrders} orders expired.`
          );
        }
      } catch (error) {
        logger.error(`[Cron Task Error] Reservation cleanup job failed: ${error.message}`, {
          stack: error.stack,
        });
      } finally {
        isJobRunning = false;
      }
    },
    {
      scheduled: true,
      timezone: 'UTC',
    }
  );

  logger.info('Reservation cleanup scheduler started successfully.');
};

/**
 * Gracefully stop the reservation scheduler
 */
const stopReservationScheduler = () => {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('Reservation cleanup scheduler stopped.');
  }
};

module.exports = {
  startReservationScheduler,
  stopReservationScheduler,
};
