const express = require('express');
const {
  getProducts,
  getProductById,
  getInventoryStats,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');
const { protect, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Public read routes
router.get('/', getProducts);
router.get('/stats', protect, requireAdmin, getInventoryStats);
router.get('/:id', getProductById);

// Admin-only write routes
router.post('/', protect, requireAdmin, createProduct);
router.put('/:id', protect, requireAdmin, updateProduct);
router.delete('/:id', protect, requireAdmin, deleteProduct);

module.exports = router;
