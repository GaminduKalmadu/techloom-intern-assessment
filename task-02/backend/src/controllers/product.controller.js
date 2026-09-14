const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get products with filtering, search, and pagination
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      categoryId,
      isActive,
      stockStatus,
      sort = '-createdAt',
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    // Filter by active status
    if (typeof isActive !== 'undefined') {
      query.isActive = isActive === 'true';
    }

    // Filter by category
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      query.categoryId = categoryId;
    }

    // Keyword search
    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Fetch products
    let products = await Product.find(query)
      .populate('categoryId', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Apply optional stock status filter (in_stock, low_stock, out_of_stock)
    if (stockStatus) {
      if (stockStatus === 'out_of_stock') {
        products = products.filter((p) => p.availableStock <= 0);
      } else if (stockStatus === 'low_stock') {
        products = products.filter((p) => p.availableStock > 0 && p.availableStock <= 10);
      } else if (stockStatus === 'in_stock') {
        products = products.filter((p) => p.availableStock > 10);
      }
    }

    const total = await Product.countDocuments(query);

    return ApiResponse.success(
      res,
      'Products retrieved successfully.',
      { products },
      200,
      {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid product ID format.');
    }

    const product = await Product.findById(id).populate('categoryId', 'name slug');
    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    return ApiResponse.success(res, 'Product retrieved successfully.', { product }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get admin inventory telemetry & KPI statistics
 * @route   GET /api/products/stats
 * @access  Protected (Admin only)
 */
const getInventoryStats = async (req, res, next) => {
  try {
    const allProducts = await Product.find({});

    const totalProducts = allProducts.length;
    let activeProducts = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let inStockCount = 0;
    let totalStock = 0;
    let totalReserved = 0;
    let totalValuation = 0;

    allProducts.forEach((p) => {
      if (p.isActive) activeProducts++;

      const available = p.availableStock;
      if (available <= 0) {
        outOfStockCount++;
      } else if (available <= 10) {
        lowStockCount++;
      } else {
        inStockCount++;
      }

      totalStock += p.stockQuantity || 0;
      totalReserved += p.reservedQuantity || 0;
      totalValuation += (p.price || 0) * (p.stockQuantity || 0);
    });

    const totalAvailable = Math.max(0, totalStock - totalReserved);

    return ApiResponse.success(
      res,
      'Inventory statistics retrieved successfully.',
      {
        stats: {
          totalProducts,
          activeProducts,
          lowStockCount,
          outOfStockCount,
          inStockCount,
          totalStock,
          totalReserved,
          totalAvailable,
          totalValuation: Math.round(totalValuation * 100) / 100,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Protected (Admin only)
 */
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      categoryId,
      price,
      imageUrl,
      stockQuantity,
      isActive = true,
    } = req.body;

    // 1. Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw ApiError.badRequest('Product name is required.');
    }

    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      throw ApiError.badRequest('A valid category ID is required.');
    }

    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      throw ApiError.badRequest('Selected category does not exist.');
    }

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      throw ApiError.badRequest('Price must be a valid non-negative number.');
    }

    const parsedStock = Number(stockQuantity);
    if (isNaN(parsedStock) || parsedStock < 0 || !Number.isInteger(parsedStock)) {
      throw ApiError.badRequest('Stock quantity must be a non-negative integer.');
    }

    // 2. Create product (reservedQuantity is strictly initialized to 0, protected from admin input)
    const product = await Product.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      categoryId,
      price: parsedPrice,
      imageUrl: imageUrl ? imageUrl.trim() : '',
      stockQuantity: parsedStock,
      reservedQuantity: 0,
      isActive: Boolean(isActive),
    });

    await product.populate('categoryId', 'name slug');

    return ApiResponse.success(res, 'Product created successfully.', { product }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing product
 * @route   PUT /api/products/:id
 * @access  Protected (Admin only)
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      categoryId,
      price,
      imageUrl,
      stockQuantity,
      isActive,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid product ID format.');
    }

    const product = await Product.findById(id);
    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    if (name && typeof name === 'string' && name.trim()) {
      product.name = name.trim();
    }

    if (typeof description === 'string') {
      product.description = description.trim();
    }

    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        throw ApiError.badRequest('Invalid category ID format.');
      }
      const categoryExists = await Category.findById(categoryId);
      if (!categoryExists) {
        throw ApiError.badRequest('Selected category does not exist.');
      }
      product.categoryId = categoryId;
    }

    if (typeof price !== 'undefined') {
      const parsedPrice = Number(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        throw ApiError.badRequest('Price must be a valid non-negative number.');
      }
      product.price = parsedPrice;
    }

    if (typeof imageUrl === 'string') {
      product.imageUrl = imageUrl.trim();
    }

    if (typeof stockQuantity !== 'undefined') {
      const parsedStock = Number(stockQuantity);
      if (isNaN(parsedStock) || parsedStock < 0 || !Number.isInteger(parsedStock)) {
        throw ApiError.badRequest('Stock quantity must be a non-negative integer.');
      }

      // Enforce business rule: stock cannot be lower than active reservations
      if (parsedStock < product.reservedQuantity) {
        throw ApiError.badRequest(
          `Stock quantity cannot be less than currently reserved quantity (${product.reservedQuantity}).`
        );
      }
      product.stockQuantity = parsedStock;
    }

    if (typeof isActive !== 'undefined') {
      product.isActive = Boolean(isActive);
    }

    // NOTE: reservedQuantity is never modified directly from this endpoint
    await product.save();
    await product.populate('categoryId', 'name slug');

    return ApiResponse.success(res, 'Product updated successfully.', { product }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate or permanently delete product
 * @route   DELETE /api/products/:id
 * @access  Protected (Admin only)
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hard } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid product ID format.');
    }

    const product = await Product.findById(id);
    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    // Hard deletion: permanently remove from database
    if (hard === 'true') {
      if (product.reservedQuantity > 0) {
        throw ApiError.badRequest(
          `Cannot permanently delete product with ${product.reservedQuantity} active reservation(s). Deactivate instead.`
        );
      }

      await Product.findByIdAndDelete(id);
      return ApiResponse.success(res, 'Product permanently deleted.', null, 200);
    }

    // Soft deletion / deactivation (preferred standard)
    product.isActive = false;
    await product.save();

    return ApiResponse.success(res, 'Product deactivated successfully.', { product }, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  getInventoryStats,
  createProduct,
  updateProduct,
  deleteProduct,
};
