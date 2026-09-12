const express = require('express');
const productController = require('../controllers/product.controller');
const validate = require('../middleware/validate.middleware');
const {
  productIdParamValidation,
  createProductValidation,
  updateProductValidation,
  adjustStockValidation,
  getProductsQueryValidation,
} = require('../validations/product.validation');

const router = express.Router();

// GET /api/products/stats - Aggregated metrics for inventory cards
router.get('/stats', productController.getProductStats);

// POST /api/products/seed - Optional demo products seeder
router.post('/seed', productController.seedProducts);

// GET /api/products - List products with search, sorting, filtering, and pagination
router.get('/', getProductsQueryValidation, validate, productController.getProducts);

// POST /api/products - Create a new product
router.post('/', createProductValidation, validate, productController.createProduct);

// GET /api/products/:id - Single product details
router.get('/:id', productIdParamValidation, validate, productController.getProductById);

// PUT /api/products/:id - Update product details
router.put('/:id', updateProductValidation, validate, productController.updateProduct);

// DELETE /api/products/:id - Delete a product
router.delete('/:id', productIdParamValidation, validate, productController.deleteProduct);

// PATCH /api/products/:id/stock - Adjust stock quantity
router.patch('/:id/stock', adjustStockValidation, validate, productController.adjustStock);

module.exports = router;
