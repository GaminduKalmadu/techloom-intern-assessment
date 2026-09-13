const express = require('express');
const orderController = require('../controllers/order.controller');

const router = express.Router();

// POST /api/orders/create - Create order with stock reservation
router.post('/create', orderController.createOrder);
router.post('/', orderController.createOrder);

// GET /api/orders - List orders with status filters
router.get('/', orderController.getOrders);

// GET /api/orders/:id - Get order details
router.get('/:id', orderController.getOrderById);

// POST /api/orders/:id/cancel - Cancel order and release stock
router.post('/:id/cancel', orderController.cancelOrder);

module.exports = router;
