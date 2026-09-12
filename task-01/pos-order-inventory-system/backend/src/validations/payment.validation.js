const { body } = require('express-validator');

const processPaymentValidation = [
  body('orderId')
    .notEmpty()
    .withMessage('orderId is required')
    .isMongoId()
    .withMessage('Invalid orderId format'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'digital_wallet'])
    .withMessage('paymentMethod must be cash, card, or digital_wallet'),
  body('transactionId')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('transactionId must be between 3 and 100 characters'),
];

module.exports = {
  processPaymentValidation,
};
