const crypto = require('crypto');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Cart = require('../models/cart.model');
const Reservation = require('../models/reservation.model');
const reservationService = require('./reservation.service');
const ApiError = require('../utils/apiError');

/**
 * Generate unique order invoice number (e.g. ORD-20260913-K7F8-A9B2)
 */
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const timeHex = Date.now().toString(36).toUpperCase();
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${dateStr}-${timeHex}-${randomHex}`;
};

/**
 * Create a new order with atomic stock reservation
 * Business Logic:
 * 1. Validate cart
 * 2. Check product availability
 * 3. Calculate total
 * 4. Create order
 *
 * @param {object} params
 * @param {string|null} params.userId - Optional registered user or null for walk-in
 * @param {Array<{ productId: string, quantity: number }>} [params.items] - Items to order (if not from active cart)
 * @param {string} [params.notes] - Order notes
 * @param {boolean} [params.fromCart] - If true, pull from user's active cart and convert it
 */
const createOrder = async ({ userId = null, items = null, notes = '', fromCart = false }) => {
  let orderItemsToProcess = items;
  let activeCartDoc = null;

  // 1. Validate cart
  if (fromCart || (!items && userId)) {
    activeCartDoc = await Cart.findOne({ userId, status: 'active' });
    if (!activeCartDoc || !activeCartDoc.items || activeCartDoc.items.length === 0) {
      throw ApiError.badRequest('Cannot create an order: Active cart is empty. Please add items to cart first.');
    }
    orderItemsToProcess = activeCartDoc.items.map((item) => ({
      productId: (item.productId && item.productId._id) ? item.productId._id.toString() : item.productId.toString(),
      quantity: item.quantity,
    }));
  }

  if (!orderItemsToProcess || !Array.isArray(orderItemsToProcess) || orderItemsToProcess.length === 0) {
    throw ApiError.badRequest('Cannot create an order: At least one item is required');
  }

  // 2. Check product availability
  const productIds = orderItemsToProcess.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  for (const item of orderItemsToProcess) {
    const product = productMap.get(item.productId.toString());
    if (!product) {
      throw ApiError.notFound(`Product not found with ID: ${item.productId}`);
    }

    const requestedQty = parseInt(item.quantity, 10);
    if (isNaN(requestedQty) || requestedQty <= 0) {
      throw ApiError.badRequest(`Invalid quantity ${item.quantity} for product '${product.name}'`);
    }

    if (product.stockQuantity < requestedQty) {
      throw ApiError.badRequest(
        `Insufficient stock for '${product.name}'. Available: ${product.stockQuantity}, Requested: ${requestedQty}`
      );
    }
  }

  // 3. Calculate total
  let calculatedTotal = 0;
  const orderItems = [];

  for (const item of orderItemsToProcess) {
    const product = productMap.get(item.productId.toString());
    const qty = parseInt(item.quantity, 10);
    const subtotal = Math.round(product.price * qty * 100) / 100;
    calculatedTotal += subtotal;

    orderItems.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: qty,
      subtotal,
    });
  }

  calculatedTotal = Math.round(calculatedTotal * 100) / 100;

  // 4. Create order
  // Initial order status is PENDING, then transitions to RESERVED upon stock reservation
  const orderNumber = generateOrderNumber();
  const order = new Order({
    orderNumber,
    userId,
    sourceCartId: activeCartDoc?._id || null,
    items: orderItems,
    totalAmount: calculatedTotal,
    status: 'PENDING',
    paymentStatus: 'pending',
    notes,
  });

  try {
    await order.save();
  } catch (error) {
    if (error.code === 11000 && activeCartDoc) {
      const existingOrder = await Order.findOne({ sourceCartId: activeCartDoc._id });
      if (existingOrder) {
        const existingReservation = await Reservation.findOne({
          orderId: existingOrder._id,
          status: { $in: ['reserved', 'ACTIVE'] },
        }).sort({ expiresAt: 1 });
        const plainExistingOrder = existingOrder.toObject();
        plainExistingOrder.reservationExpiresAt = existingReservation?.expiresAt || null;
        return plainExistingOrder;
      }
    }
    throw error;
  }

  try {
    // Atomically reserve inventory items
    await reservationService.createReservations(order._id, orderItemsToProcess);

    // Transition status to RESERVED
    order.status = 'RESERVED';
    await order.save();

    // Mark active cart converted if ordered from cart
    if (activeCartDoc) {
      activeCartDoc.status = 'converted';
      await activeCartDoc.save();
    } else if (userId && fromCart) {
      await Cart.findOneAndUpdate({ userId, status: 'active' }, { status: 'converted' });
    }

    const plainOrder = order.toObject();
    const reservation = await Reservation.findOne({ orderId: order._id }).sort({ expiresAt: 1 });
    plainOrder.reservationExpiresAt = reservation?.expiresAt || null;
    return plainOrder;
  } catch (error) {
    // If reservation fails, update order status to FAILED
    order.status = 'FAILED';
    order.notes = `${order.notes} [Reservation Failed: ${error.message}]`.trim();
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
  const plainOrder = order.toObject();
  const reservation = await Reservation.findOne({ orderId: order._id }).sort({ expiresAt: 1 });
  plainOrder.reservationExpiresAt = reservation?.expiresAt || null;
  plainOrder.reservationStatus = reservation?.status || null;
  return plainOrder;
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
  if (status && status !== 'ALL') {
    query.status = status.toUpperCase();
  }
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

  const currentStatus = (order.status || '').toUpperCase();
  if (['CANCELLED', 'EXPIRED', 'FAILED'].includes(currentStatus)) {
    throw ApiError.badRequest(`Cannot cancel an order that is already ${currentStatus}`);
  }

  order.status = 'CANCELLED';
  order.notes = `${order.notes} [Cancelled: ${reason}]`.trim();
  await order.save();

  // Only an unpaid reservation returns stock. PAID -> CANCELLED is an allowed
  // state transition, but fulfillment stock remains consumed.
  if (currentStatus === 'RESERVED') {
    await reservationService.releaseReservations(orderId);
  }

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
