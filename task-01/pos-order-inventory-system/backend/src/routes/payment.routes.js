const express = require('express');
const { param, query } = require('express-validator');
const paymentController = require('../controllers/payment.controller');
const { processPaymentValidation } = require('../validations/payment.validation');
const validate = require('../middleware/validate.middleware');
const { paymentLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
router.post('/process', paymentLimiter, processPaymentValidation, validate, paymentController.processPayment);
router.get('/', query('status').optional().isIn(['ALL', 'PENDING', 'SUCCESS', 'FAILED', 'TIMEOUT']), validate, paymentController.getPayments);
router.get('/order/:orderId', param('orderId').isMongoId(), validate, paymentController.getPaymentByOrderId);
router.get('/:id', param('id').isMongoId(), validate, paymentController.getPaymentById);

module.exports = router;
