const Product = require('../models/product.model');
const ApiError = require('../utils/apiError');

/**
 * Sample realistic retail products for one-click catalog seeding
 */
const SAMPLE_PRODUCTS = [
  {
    name: 'Wireless Bluetooth Barcode Scanner',
    description: 'High-speed 1D/2D QR code scanner with USB cradle and Bluetooth 5.0.',
    category: 'Hardware',
    price: 89.99,
    stockQuantity: 24,
    imageUrl: 'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?w=400&auto=format&fit=crop&q=60',
  },
  {
    name: 'Thermal Receipt Paper Roll 80mm (Pack of 10)',
    description: 'BPA-free high sensitivity thermal paper rolls for POS receipt printers.',
    category: 'Supplies',
    price: 19.5,
    stockQuantity: 8, // Low stock demo
    imageUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=400&auto=format&fit=crop&q=60',
  },
  {
    name: 'All-in-One Touchscreen POS Terminal 15.6"',
    description: 'Full HD capacitive touchscreen with Intel Quad-Core, 8GB RAM, and integrated card reader.',
    category: 'Hardware',
    price: 749.0,
    stockQuantity: 5, // Low stock demo
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=400&auto=format&fit=crop&q=60',
  },
  {
    name: 'Heavy-Duty Electronic Cash Drawer (RJ11)',
    description: 'Steel construction cash drawer with 5 bill / 8 coin removable tray slots.',
    category: 'Hardware',
    price: 65.0,
    stockQuantity: 15,
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&auto=format&fit=crop&q=60',
  },
  {
    name: 'Artisan Espresso Dark Roast Beans 1kg',
    description: 'Fair-trade whole bean organic Arabica blend roasted for coffee shop registers.',
    category: 'Beverages',
    price: 24.0,
    stockQuantity: 42,
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&auto=format&fit=crop&q=60',
  },
  {
    name: 'Techloom Branded Cotton Staff Polo (Navy - M)',
    description: '100% breathable combed cotton store uniform polo with embroidered chest emblem.',
    category: 'Apparel',
    price: 29.99,
    stockQuantity: 30,
    imageUrl: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&auto=format&fit=crop&q=60',
  },
  {
    name: 'Smart USB POS Customer Display Pole',
    description: '2-line alphanumeric bright VFD customer price display with adjustable angle.',
    category: 'Hardware',
    price: 45.0,
    stockQuantity: 0, // Out of stock demo
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=60',
  },
  {
    name: 'High-Speed POS Thermal Receipt Printer (USB/LAN)',
    description: '260mm/s ultra fast auto-cutter receipt printer compatible with standard ESC/POS.',
    category: 'Hardware',
    price: 135.0,
    stockQuantity: 12,
    imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&auto=format&fit=crop&q=60',
  },
  {
    name: 'Reusable Canvas Tote Bag (Natural Beige)',
    description: 'Heavy duty 12oz eco-friendly shopping tote bag with reinforced handles.',
    category: 'Accessories',
    price: 6.5,
    stockQuantity: 150,
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&auto=format&fit=crop&q=60',
  },
  {
    name: 'Stainless Steel Insulated Travel Tumbler 500ml',
    description: 'Double-wall vacuum insulation keeps drinks hot for 12 hours or cold for 24 hours.',
    category: 'Accessories',
    price: 18.0,
    stockQuantity: 3, // Low stock demo
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&auto=format&fit=crop&q=60',
  },
];

/**
 * Create a new product in the catalog
 */
const createProduct = async (productData) => {
  const product = await Product.create(productData);
  return product;
};

/**
 * Retrieve paginated products with search, filtering, and sorting
 */
const getProducts = async (filters = {}) => {
  const {
    category,
    search,
    status, // 'in_stock' | 'low_stock' | 'out_of_stock'
    minPrice,
    maxPrice,
    lowStockThreshold = 10,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const query = {};

  // Category filtering
  if (category && category !== 'all') {
    query.category = category;
  }

  // Search by text or regex on name/description/category
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { name: searchRegex },
      { category: searchRegex },
      { description: searchRegex },
    ];
  }

  // Stock status filter
  if (status) {
    const threshold = Number(lowStockThreshold) || 10;
    if (status === 'out_of_stock') {
      query.stockQuantity = 0;
    } else if (status === 'low_stock') {
      query.stockQuantity = { $gt: 0, $lte: threshold };
    } else if (status === 'in_stock') {
      query.stockQuantity = { $gt: threshold };
    }
  }

  // Price range filtering
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined && minPrice !== '') query.price.$gte = Number(minPrice);
    if (maxPrice !== undefined && maxPrice !== '') query.price.$lte = Number(maxPrice);
  }

  const numericPage = Math.max(1, parseInt(page, 10) || 1);
  const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (numericPage - 1) * numericLimit;

  // Sorting
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
      totalPages: Math.ceil(total / numericLimit) || 1,
      hasNextPage: numericPage < Math.ceil(total / numericLimit),
      hasPrevPage: numericPage > 1,
    },
  };
};

/**
 * Retrieve aggregated statistics for Inventory Dashboard
 */
const getProductStats = async (lowStockThreshold = 10) => {
  const threshold = Number(lowStockThreshold) || 10;

  const [aggregationResult, categories] = await Promise.all([
    Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          availableStock: { $sum: '$stockQuantity' },
          totalInventoryValue: {
            $sum: { $multiply: ['$price', '$stockQuantity'] },
          },
          lowStockCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ['$stockQuantity', 0] },
                    { $lte: ['$stockQuantity', threshold] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          outOfStockCount: {
            $sum: {
              $cond: [{ $eq: ['$stockQuantity', 0] }, 1, 0],
            },
          },
        },
      },
    ]),
    Product.distinct('category'),
  ]);

  const stats = aggregationResult[0] || {
    totalProducts: 0,
    availableStock: 0,
    totalInventoryValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  };

  return {
    totalProducts: stats.totalProducts,
    availableStock: stats.availableStock,
    lowStockItems: stats.lowStockCount,
    outOfStockItems: stats.outOfStockCount,
    inventoryValue: Math.round(stats.totalInventoryValue * 100) / 100,
    categories: categories.sort(),
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
 * Atomically adjust stock quantity (positive or negative adjustment)
 */
const adjustStock = async (id, quantityDelta) => {
  const delta = parseInt(quantityDelta, 10);
  if (isNaN(delta) || delta === 0) {
    throw ApiError.badRequest('quantityDelta must be a non-zero integer');
  }

  const query = { _id: id };
  if (delta < 0) {
    query.stockQuantity = { $gte: Math.abs(delta) };
  }

  const updatedProduct = await Product.findOneAndUpdate(
    query,
    { $inc: { stockQuantity: delta } },
    { new: true }
  );

  if (!updatedProduct) {
    const exists = await Product.findById(id);
    if (!exists) {
      throw ApiError.notFound(`Product not found with ID ${id}`);
    }
    throw ApiError.badRequest(
      `Insufficient stock for '${exists.name}'. Current stock: ${exists.stockQuantity}, cannot reduce by ${Math.abs(delta)}`
    );
  }

  return updatedProduct;
};

/**
 * Seed sample products if collection is empty
 */
const seedSampleProducts = async (force = false) => {
  const count = await Product.countDocuments();
  if (count > 0 && !force) {
    return {
      message: 'Product catalog already contains data',
      count,
    };
  }

  const inserted = await Product.insertMany(SAMPLE_PRODUCTS);
  return {
    message: `Successfully seeded ${inserted.length} sample retail products`,
    count: inserted.length,
    products: inserted,
  };
};

module.exports = {
  createProduct,
  getProducts,
  getProductStats,
  getProductById,
  updateProduct,
  deleteProduct,
  adjustStock,
  seedSampleProducts,
  SAMPLE_PRODUCTS,
};
