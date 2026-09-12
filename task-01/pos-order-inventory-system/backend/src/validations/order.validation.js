const { body, param, query } = require('express-validator');

const createOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain an array with at least one item'),
  body('items.*.productId')
    .notEmpty()
    .withMessage('Each item must have a productId')
    .isMongoId()
    .withMessage('Invalid item productId format'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Item quantity must be an integer >= 1'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

const getOrdersQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'reserved', 'paid', 'completed', 'cancelled', 'refunded'])
    .withMessage('Invalid order status'),
  query('paymentStatus')
    .optional()
    .isIn(['pending', 'paid', 'failed', 'refunded'])
    .withMessage('Invalid payment status'),
];

const cancelOrderValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID format'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Cancellation reason cannot exceed 200 characters'),
];

module.exports = {
  createOrderValidation,
  getOrdersQueryValidation,
  cancelOrderValidation,
};
