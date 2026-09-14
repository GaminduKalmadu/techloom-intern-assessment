const mongoose = require('mongoose');
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

const RESERVATION_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Initialize checkout and reserve stock atomically with ACID transaction
 * POST /api/checkout
 */
const createCheckout = async (req, res, next) => {
  const userId = req.user._id;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // 1 & 2. Load ACTIVE cart within transaction session
      const cart = await Cart.findOne({ userId, status: 'ACTIVE' }).session(session);

      if (!cart || !cart.items || cart.items.length === 0) {
        throw ApiError.badRequest('Cannot checkout with an empty or non-existent cart.');
      }

      // 3 & 4. Fetch all products in cart to validate active status and get official DB prices
      const productIds = cart.items.map((i) => i.productId);
      const products = await Product.find({ _id: { $in: productIds } }).session(session);
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      // 5. Validate that all products exist and are active
      for (const item of cart.items) {
        const product = productMap.get(item.productId.toString());
        if (!product) {
          throw ApiError.badRequest(`Product with ID ${item.productId} does not exist.`);
        }
        if (!product.isActive) {
          throw ApiError.badRequest(`Product "${product.name}" is no longer active or available for sale.`);
        }
      }

      // 8 & 9. Concurrency-Safe Stock Reservation:
      // Execute conditional atomic update on each product within the transaction.
      // Condition: stockQuantity - reservedQuantity >= requestedQuantity
      // Atomic update: $inc: { reservedQuantity: requestedQuantity }
      // If any product fails, abort transaction immediately.
      for (const item of cart.items) {
        const product = productMap.get(item.productId.toString());

        const reservedProduct = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            isActive: true,
            $expr: {
              $gte: [
                { $subtract: ['$stockQuantity', '$reservedQuantity'] },
                item.quantity,
              ],
            },
          },
          {
            $inc: { reservedQuantity: item.quantity },
          },
          {
            session,
            new: true,
          }
        );

        if (!reservedProduct) {
          const freshProd = await Product.findById(item.productId);
          const available = freshProd ? Math.max(0, freshProd.stockQuantity - freshProd.reservedQuantity) : 0;
          throw ApiError.conflict(
            `Insufficient stock available for product "${product.name}". Requested: ${item.quantity}, Available: ${available}.`
          );
        }
      }

      // 6 & 7. Calculate totals using current database prices
      let subtotal = 0;
      const orderItems = cart.items.map((item) => {
        const product = productMap.get(item.productId.toString());
        const itemSubtotal = product.price * item.quantity;
        subtotal += itemSubtotal;

        return {
          productId: product._id,
          productName: product.name,
          price: product.price,
          quantity: item.quantity,
        };
      });

      const total = subtotal;

      // 12. Set expiresAt to current time + 5 minutes
      const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MS);

      // 10 & 13. Create Order with status RESERVED and paymentStatus PENDING
      const [order] = await Order.create(
        [
          {
            userId,
            items: orderItems,
            subtotal,
            total,
            status: 'RESERVED',
            paymentStatus: 'PENDING',
          },
        ],
        { session }
      );

      // 11. Create Reservation with status ACTIVE
      const reservationItems = cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const [reservation] = await Reservation.create(
        [
          {
            orderId: order._id,
            userId,
            items: reservationItems,
            status: 'ACTIVE',
            expiresAt,
          },
        ],
        { session }
      );

      // 14. Set cart status = CHECKOUT
      cart.status = 'CHECKOUT';
      await cart.save({ session });

      // Commit ACID transaction
      await session.commitTransaction();

      // 15. Return checkout details matching assessment specification
      return ApiResponse.success(
        res,
        'Checkout initialized and inventory reserved for 5 minutes',
        {
          orderId: order._id,
          reservationId: reservation._id,
          total: order.total,
          expiresAt: reservation.expiresAt,
        },
        201
      );
    } catch (error) {
      await session.abortTransaction();

      // Detect MongoDB WriteConflict or TransientTransactionError during concurrent operations
      const isTransientOrConflict =
        error.code === 112 ||
        error.errorLabels?.includes('TransientTransactionError') ||
        error.hasErrorLabel?.('TransientTransactionError') ||
        (typeof error.message === 'string' && error.message.includes('WriteConflict'));

      if (isTransientOrConflict && attempt < maxRetries) {
        // Jittered backoff before retry
        await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 50));
        continue;
      }

      if (isTransientOrConflict) {
        return next(
          ApiError.conflict(
            'Unable to reserve stock due to concurrent checkout conflict. Insufficient stock available.'
          )
        );
      }

      return next(error);
    } finally {
      session.endSession();
    }
  }
};

/**
 * Get checkout order details along with active reservation
 * GET /api/checkout/:orderId
 */
const getCheckoutOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw ApiError.badRequest('Invalid order ID format');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // Verify ownership
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      throw ApiError.forbidden('You are not authorized to view this order');
    }

    // Fetch linked reservation
    const reservation = await Reservation.findOne({ orderId: order._id }).sort({ createdAt: -1 });

    return ApiResponse.success(res, 'Order details retrieved', {
      order,
      reservation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get latest active checkout session for authenticated customer
 * GET /api/checkout/active
 */
const getActiveCheckout = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Look for active reservation
    const reservation = await Reservation.findOne({
      userId,
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!reservation) {
      return ApiResponse.success(res, 'No active checkout reservation found', {
        active: false,
      });
    }

    const order = await Order.findById(reservation.orderId);

    return ApiResponse.success(res, 'Active checkout reservation retrieved', {
      active: true,
      order,
      reservation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCheckout,
  getCheckoutOrder,
  getActiveCheckout,
};
