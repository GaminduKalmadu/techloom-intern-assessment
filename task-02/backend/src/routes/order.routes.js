const express = require('express');
const { getMyOrders, getOrderById } = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All order endpoints require authentication
router.use(protect);

router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);

module.exports = router;
