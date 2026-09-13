const { body, param } = require('express-validator');

const addItemToCartValidation = [
  body('productId')
    .notEmpty()
    .withMessage('productId is required')
    .isMongoId()
    .withMessage('Invalid productId format'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be an integer >= 1'),
];

const updateCartItemValidation = [
  param('itemId')
    .isMongoId()
    .withMessage('Invalid itemId format'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 0 })
    .withMessage('Quantity must be an integer >= 0'),
];

module.exports = {
  addItemToCartValidation,
  updateCartItemValidation,
};
