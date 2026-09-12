const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Cart = require('../models/cart.model');
const reservationService = require('./reservation.service');
const ApiError = require('../utils/apiError');

/**
 * Generate unique order invoice number (e.g. ORD-20260912-7894)
 */
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${randomSuffix}`;
};

/**
 * Create a new order with atomic stock reservation
 * @param {object} params
 * @param {string|null} params.userId - Optional registered user or null for walk-in
 * @param {Array<{ productId: string, quantity: number }>} params.items - Items to order
 * @param {string} [params.notes] - Order notes
 * @param {boolean} [params.fromCart] - If true, mark user's cart as converted
 */
const createOrder = async ({ userId = null, items, notes = '', fromCart = false }) => {
  if (!items || items.length === 0) {
    throw ApiError.badRequest('Cannot create an order without items');
  }

  // 1. Fetch current product information and construct order items snapshot
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  let calculatedTotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = productMap.get(item.productId.toString());
    if (!product) {
      throw ApiError.notFound(`Product not found with ID ${item.productId}`);
    }

    if (item.quantity <= 0) {
      throw ApiError.badRequest(`Invalid quantity ${item.quantity} for product '${product.name}'`);
    }

    const subtotal = Math.round(product.price * item.quantity * 100) / 100;
    calculatedTotal += subtotal;

    orderItems.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      subtotal,
    });
  }

  calculatedTotal = Math.round(calculatedTotal * 100) / 100;

  // 2. Create the pending order document
  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    userId,
    items: orderItems,
    totalAmount: calculatedTotal,
    status: 'reserved',
    paymentStatus: 'pending',
    notes,
  });

  try {
    // 3. Coordinate with reservation service to atomically reserve inventory
    await reservationService.createReservations(order._id, items);

    // 4. If ordered from cart, mark user's cart as converted
    if (userId && fromCart) {
      await Cart.findOneAndUpdate(
        { userId, status: 'active' },
        { status: 'converted' }
      );
    }

    return order;
  } catch (error) {
    // If reservation fails, mark order as cancelled
    order.status = 'cancelled';
    order.notes = `${order.notes} [Failed reservation: ${error.message}]`.trim();
    await order.save();
    throw error;
  }
};

/**
 * Retrieve order by ID
 */
const getOrderById = async (id) => {
  const order = await Order.findById(id).populate('userId', 'name email role');
  if (!order) {
    throw ApiError.notFound(`Order not found with ID ${id}`);
  }
  return order;
};

/**
 * Retrieve order by unique order number
 */
const getOrderByNumber = async (orderNumber) => {
  const order = await Order.findOne({ orderNumber }).populate('userId', 'name email role');
  if (!order) {
    throw ApiError.notFound(`Order not found with number ${orderNumber}`);
  }
  return order;
};

/**
 * Retrieve paginated orders with filters
 */
const getOrders = async (filters = {}) => {
  const { status, paymentStatus, userId, page = 1, limit = 20 } = filters;

  const query = {};
  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (userId) query.userId = userId;

  const numericPage = Math.max(1, parseInt(page, 10));
  const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (numericPage - 1) * numericLimit;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit)
      .populate('userId', 'name email')
      .lean(),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    pagination: {
      total,
      page: numericPage,
      limit: numericLimit,
      totalPages: Math.ceil(total / numericLimit),
    },
  };
};

/**
 * Cancel an order and release reserved stock
 */
const cancelOrder = async (orderId, reason = 'Cancelled by user') => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (['completed', 'refunded', 'cancelled'].includes(order.status)) {
    throw ApiError.badRequest(`Cannot cancel an order that is already ${order.status}`);
  }

  order.status = 'cancelled';
  order.notes = `${order.notes} [Cancelled: ${reason}]`.trim();
  await order.save();

  // Release inventory reservations
  await reservationService.releaseReservations(orderId);

  return order;
};

module.exports = {
  generateOrderNumber,
  createOrder,
  getOrderById,
  getOrderByNumber,
  getOrders,
  cancelOrder,
};
