const Product = require('../models/product.model');
const ApiError = require('../utils/apiError');

/**
 * Create a new product in the catalog
 */
const createProduct = async (productData) => {
  const product = await Product.create(productData);
  return product;
};

/**
 * Retrieve paginated products with search and filtering
 */
const getProducts = async (filters = {}) => {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    lowStockThreshold,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const query = {};

  if (category) {
    query.category = category;
  }

  if (search) {
    query.$text = { $search: search };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
  }

  if (lowStockThreshold !== undefined) {
    query.stockQuantity = { $lte: Number(lowStockThreshold) };
  }

  const numericPage = Math.max(1, parseInt(page, 10));
  const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (numericPage - 1) * numericLimit;

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [products, total] = await Promise.all([
    Product.find(query).sort(sortOptions).skip(skip).limit(numericLimit).lean(),
    Product.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      total,
      page: numericPage,
      limit: numericLimit,
      totalPages: Math.ceil(total / numericLimit),
    },
  };
};

/**
 * Find product by ID
 */
const getProductById = async (id) => {
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound(`Product not found with ID ${id}`);
  }
  return product;
};

/**
 * Update product fields
 */
const updateProduct = async (id, updateData) => {
  const product = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw ApiError.notFound(`Product not found with ID ${id}`);
  }

  return product;
};

/**
 * Delete product by ID
 */
const deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    throw ApiError.notFound(`Product not found with ID ${id}`);
  }
  return product;
};

/**
 * Atomically adjust stock quantity (supports positive or negative adjustment)
 */
const adjustStock = async (id, quantityDelta) => {
  const query = { _id: id };
  if (quantityDelta < 0) {
    // Ensure sufficient stock exists before decrementing
    query.stockQuantity = { $gte: Math.abs(quantityDelta) };
  }

  const updatedProduct = await Product.findOneAndUpdate(
    query,
    { $inc: { stockQuantity: quantityDelta } },
    { new: true }
  );

  if (!updatedProduct) {
    const exists = await Product.findById(id);
    if (!exists) {
      throw ApiError.notFound(`Product not found with ID ${id}`);
    }
    throw ApiError.badRequest(`Insufficient stock for product ${exists.name}`);
  }

  return updatedProduct;
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  adjustStock,
};
