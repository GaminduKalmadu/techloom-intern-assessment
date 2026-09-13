const orderService = require('../services/order.service');
const ApiResponse = require('../utils/apiResponse');

/**
 * Create a new order with stock reservation
 * POST /api/orders/create
 */
const createOrder = async (req, res, next) => {
  try {
    const userId = req.body.userId || req.user?.id || 'demo_pos_user';
    const { items, notes, fromCart } = req.body;

    const order = await orderService.createOrder({
      userId,
      items: Array.isArray(items) && items.length > 0 ? items : null,
      notes: notes || '',
      fromCart: fromCart !== undefined ? fromCart : !items,
    });

    return ApiResponse.created(
      res,
      'Order created successfully with inventory reservation',
      order
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Get paginated list of orders
 * GET /api/orders
 */
const getOrders = async (req, res, next) => {
  try {
    const result = await orderService.getOrders(req.query);
    return ApiResponse.success(
      res,
      'Orders retrieved successfully',
      result.orders,
      200,
      result.pagination
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Get single order by ID
 * GET /api/orders/:id
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    return ApiResponse.success(res, 'Order retrieved successfully', order);
  } catch (err) {
    next(err);
  }
};

/**
 * Pay / confirm order
 * POST /api/orders/:id/pay
 */
const payOrder = async (req, res, next) => {
  try {
    const order = await orderService.payOrder(req.params.id, req.body);
    return ApiResponse.success(res, 'Order marked as PAID successfully', order);
  } catch (err) {
    next(err);
  }
};

/**
 * Cancel order and release reserved inventory
 * POST /api/orders/:id/cancel
 */
const cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(
      req.params.id,
      req.body.reason || 'Cancelled by user'
    );
    return ApiResponse.success(
      res,
      'Order cancelled and inventory reservation released',
      order
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  payOrder,
  cancelOrder,
};
