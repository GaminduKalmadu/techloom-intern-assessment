const express = require('express');
const cartController = require('../controllers/cart.controller');

const router = express.Router();

// POST /api/cart/add - Add item to cart
router.post('/add', cartController.addToCart);

// PUT /api/cart/update - Update item quantity in cart
router.put('/update', cartController.updateCart);

// DELETE /api/cart/remove - Remove item from cart
router.delete('/remove', cartController.removeCartItem);
router.delete('/remove/:itemId', cartController.removeCartItem);

// DELETE /api/cart/clear/:userId - Clear active cart
router.delete('/clear/:userId', cartController.clearCart);
router.post('/clear', cartController.clearCart);

// GET /api/cart/:userId - Get active cart for user
router.get('/:userId', cartController.getCart);

// Fallback GET / - Get cart for default/authenticated user
router.get('/', cartController.getCart);

module.exports = router;
