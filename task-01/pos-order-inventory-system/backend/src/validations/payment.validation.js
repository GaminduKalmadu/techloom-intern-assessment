const { body } = require('express-validator');

const processPaymentValidation = [
  body('orderId')
    .notEmpty()
    .withMessage('orderId is required')
    .isMongoId()
    .withMessage('Invalid orderId format'),
  body('paymentMethod')
    .isIn(['CARD', 'CASH', 'DIGITAL_WALLET'])
    .withMessage('paymentMethod must be CARD, CASH, or DIGITAL_WALLET'),
  body('simulationOutcome')
    .optional()
    .isIn(['SUCCESS', 'FAILED', 'TIMEOUT'])
    .withMessage('simulationOutcome must be SUCCESS, FAILED, or TIMEOUT'),
];

module.exports = {
  processPaymentValidation,
};
