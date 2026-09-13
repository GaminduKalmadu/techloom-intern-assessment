const paymentService = require('../services/payment.service');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

const processPayment = async (req, res, next) => {
  try {
    const idempotencyKey = req.get('Idempotency-Key');
    if (!idempotencyKey || idempotencyKey.trim().length < 8 || idempotencyKey.length > 200) {
      throw ApiError.coded(400, 'INVALID_IDEMPOTENCY_KEY', 'A valid Idempotency-Key header is required.');
    }
    const result = await paymentService.processPayment({
      orderId: req.body.orderId,
      paymentMethod: req.body.paymentMethod,
      simulationOutcome: req.body.simulationOutcome,
      idempotencyKey: idempotencyKey.trim(),
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getPayments = async (req, res, next) => {
  try {
    const result = await paymentService.getPayments(req.query);
    return ApiResponse.success(res, 'Payments retrieved successfully', result.payments, 200, result.pagination);
  } catch (error) { next(error); }
};

const getPaymentById = async (req, res, next) => {
  try {
    return ApiResponse.success(res, 'Payment retrieved successfully', await paymentService.getPaymentById(req.params.id));
  } catch (error) { next(error); }
};

const getPaymentByOrderId = async (req, res, next) => {
  try {
    return ApiResponse.success(res, 'Payment retrieved successfully', await paymentService.getPaymentByOrderId(req.params.orderId));
  } catch (error) { next(error); }
};

module.exports = { processPayment, getPayments, getPaymentById, getPaymentByOrderId };
