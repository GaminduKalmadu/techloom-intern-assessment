const express = require('express');
const {
  getProducts,
  getProductById,
  getInventoryStats,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');
const { protect, requireAdmin, optionalAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// Public / Customer read routes (with optional auth for admin bypass and data masking)
router.get('/', optionalAuth, getProducts);
router.get('/stats', protect, requireAdmin, getInventoryStats);
router.get('/:id', optionalAuth, getProductById);

// Admin-only write routes
router.post('/', protect, requireAdmin, createProduct);
router.put('/:id', protect, requireAdmin, updateProduct);
router.delete('/:id', protect, requireAdmin, deleteProduct);

module.exports = router;
