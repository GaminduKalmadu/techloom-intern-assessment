const { body, param, query } = require('express-validator');

const productIdParamValidation = [
  param('id').isMongoId().withMessage('Invalid product ID format'),
];

const createProductValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 120 })
    .withMessage('Product name cannot exceed 120 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Product category is required'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number (>= 0)'),
  body('stockQuantity')
    .notEmpty()
    .withMessage('Stock quantity is required')
    .isInt({ min: 0 })
    .withMessage('Stock quantity cannot be negative and must be an integer >= 0'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('imageUrl')
    .optional()
    .trim()
    .custom((val) => {
      if (!val) return true;
      if (typeof val === 'string' && val.startsWith('data:image/')) {
        // Calculate raw binary size from base64 representation
        const base64Data = val.split(',')[1] || val;
        const approximateBytes = (base64Data.length * 3) / 4;
        const MAX_BYTES = 10 * 1024 * 1024; // 10MB
        if (approximateBytes > MAX_BYTES) {
          throw new Error('Image size cannot exceed 10MB');
        }
      }
      return true;
    }),
];

const updateProductValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty')
    .isLength({ max: 120 })
    .withMessage('Product name cannot exceed 120 characters'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number (>= 0)'),
  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity cannot be negative and must be an integer >= 0'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }),
  body('imageUrl')
    .optional()
    .trim()
    .custom((val) => {
      if (!val) return true;
      if (typeof val === 'string' && val.startsWith('data:image/')) {
        const base64Data = val.split(',')[1] || val;
        const approximateBytes = (base64Data.length * 3) / 4;
        const MAX_BYTES = 10 * 1024 * 1024; // 10MB
        if (approximateBytes > MAX_BYTES) {
          throw new Error('Image size cannot exceed 10MB');
        }
      }
      return true;
    }),
];

const adjustStockValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  body('quantityDelta')
    .notEmpty()
    .withMessage('quantityDelta is required')
    .isInt()
    .withMessage('quantityDelta must be an integer (e.g. +5, -2)'),
];

const getProductsQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice must be >= 0'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice must be >= 0'),
  query('lowStockThreshold').optional().isInt({ min: 0 }).withMessage('lowStockThreshold must be an integer >= 0'),
  query('status')
    .optional()
    .isIn(['in_stock', 'low_stock', 'out_of_stock', 'all'])
    .withMessage('Status must be in_stock, low_stock, out_of_stock, or all'),
  query('sortBy')
    .optional()
    .isIn(['name', 'price', 'stockQuantity', 'createdAt', 'category'])
    .withMessage('Invalid sortBy parameter'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be asc or desc'),
];

module.exports = {
  productIdParamValidation,
  createProductValidation,
  updateProductValidation,
  adjustStockValidation,
  getProductsQueryValidation,
};
