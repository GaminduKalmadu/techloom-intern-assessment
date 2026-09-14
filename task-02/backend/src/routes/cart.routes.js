const express = require('express');
const {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
} = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All cart operations require authentication
router.use(protect);

router.get('/', getCart);
router.post('/items', addItem);
router.put('/items/:productId', updateItemQuantity);
router.delete('/items/:productId', removeItem);
router.delete('/', clearCart);

module.exports = router;
