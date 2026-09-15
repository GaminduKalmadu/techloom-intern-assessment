const express = require('express');
const {
  createCheckout,
  getCheckoutOrder,
  getActiveCheckout,
} = require('../controllers/checkout.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All checkout operations require customer authentication
router.use(protect);

router.post('/', createCheckout);
router.get('/active', getActiveCheckout);
router.get('/:orderId', getCheckoutOrder);

module.exports = router;
