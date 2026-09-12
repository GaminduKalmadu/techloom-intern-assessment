const productService = require('../services/product.service');
const ApiResponse = require('../utils/apiResponse');

/**
 * Create a new product
 * POST /api/products or POST /api/v1/products
 */
const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    return ApiResponse.created(res, 'Product created successfully', product);
  } catch (err) {
    next(err);
  }
};

/**
 * Get paginated list of products with filters
 * GET /api/products or GET /api/v1/products
 */
const getProducts = async (req, res, next) => {
  try {
    const result = await productService.getProducts(req.query);
    return ApiResponse.success(res, 'Products retrieved successfully', result.products, 200, result.pagination);
  } catch (err) {
    next(err);
  }
};

/**
 * Get aggregated inventory statistics
 * GET /api/products/stats or GET /api/v1/products/stats
 */
const getProductStats = async (req, res, next) => {
  try {
    const threshold = req.query.lowStockThreshold || 10;
    const stats = await productService.getProductStats(threshold);
    return ApiResponse.success(res, 'Inventory statistics retrieved successfully', stats);
  } catch (err) {
    next(err);
  }
};

/**
 * Get single product by ID
 * GET /api/products/:id or GET /api/v1/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return ApiResponse.success(res, 'Product retrieved successfully', product);
  } catch (err) {
    next(err);
  }
};

/**
 * Update an existing product
 * PUT /api/products/:id or PUT /api/v1/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    return ApiResponse.success(res, 'Product updated successfully', product);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a product
 * DELETE /api/products/:id or DELETE /api/v1/products/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    return ApiResponse.success(res, 'Product deleted successfully', { id: req.params.id });
  } catch (err) {
    next(err);
  }
};

/**
 * Adjust stock quantity
 * PATCH /api/products/:id/stock or PATCH /api/v1/products/:id/stock
 */
const adjustStock = async (req, res, next) => {
  try {
    const { quantityDelta } = req.body;
    const product = await productService.adjustStock(req.params.id, quantityDelta);
    return ApiResponse.success(res, `Stock updated successfully for '${product.name}'`, product);
  } catch (err) {
    next(err);
  }
};

/**
 * Seed sample products if collection is empty
 * POST /api/products/seed or POST /api/v1/products/seed
 */
const seedProducts = async (req, res, next) => {
  try {
    const force = req.query.force === 'true';
    const result = await productService.seedSampleProducts(force);
    return ApiResponse.success(res, result.message, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductStats,
  getProductById,
  updateProduct,
  deleteProduct,
  adjustStock,
  seedProducts,
};
