const express = require('express');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');
const { protect, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Public route: View categories
router.get('/', getCategories);

// Admin-only modification routes
router.post('/', protect, requireAdmin, createCategory);
router.put('/:id', protect, requireAdmin, updateCategory);
router.delete('/:id', protect, requireAdmin, deleteCategory);

module.exports = router;
