const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./order.routes');
const reservationRoutes = require('./reservation.routes');
const paymentRoutes = require('./payment.routes');
const analyticsRoutes = require('./analytics.routes');
const reportRoutes = require('./report.routes');
const settingRoutes = require('./setting.routes');

const router = express.Router();

// Mount API v1 subroutes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/reservations', reservationRoutes);
router.use('/payments', paymentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingRoutes);

module.exports = router;
