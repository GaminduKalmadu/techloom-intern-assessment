const express = require('express');
const { processPayment, getPaymentByOrder } = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All payment endpoints require customer authentication
router.use(protect);

router.post('/', processPayment);
router.get('/order/:orderId', getPaymentByOrder);

module.exports = router;
