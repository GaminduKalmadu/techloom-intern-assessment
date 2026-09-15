const express = require('express');
const reportController = require('../controllers/report.controller');

const router = express.Router();

// GET /api/v1/reports/sales
router.get('/sales', reportController.getSalesReport);

// GET /api/v1/reports/inventory
router.get('/inventory', reportController.getInventoryReport);

// GET /api/v1/reports/top-products
router.get('/top-products', reportController.getTopProductsReport);

// GET /api/v1/reports/export
router.get('/export', reportController.exportReport);

module.exports = router;
