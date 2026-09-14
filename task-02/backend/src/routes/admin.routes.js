const express = require('express');
const {
  getDashboardMetrics,
  getAdminOrders,
  getAdminOrderById,
  getAdminPayments,
  getAdminRefunds,
} = require('../controllers/admin.controller');
const { protect, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Strict RBAC: All administrative monitoring endpoints require ADMIN role
router.use(protect, requireAdmin);

router.get('/dashboard', getDashboardMetrics);
router.get('/orders', getAdminOrders);
router.get('/orders/:id', getAdminOrderById);
router.get('/payments', getAdminPayments);
router.get('/refunds', getAdminRefunds);

module.exports = router;
