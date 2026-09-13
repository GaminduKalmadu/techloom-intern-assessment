const cartService = require('../services/cart.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Add an item to user's cart
 * POST /api/cart/add
 */
const addToCart = async (req, res, next) => {
  try {
    const userId = req.body.userId || req.user?.id || 'demo_pos_user';
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      throw ApiError.badRequest('productId is required');
    }

    const cart = await cartService.addItemToCart(userId, {
      productId,
      quantity: parseInt(quantity, 10) || 1,
    });

    return ApiResponse.success(res, 'Item added to cart successfully', cart, 200);
  } catch (err) {
    next(err);
  }
};

/**
 * Get active cart for a specific user
 * GET /api/cart/:userId
 */
const getCart = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user?.id || 'demo_pos_user';
    const cart = await cartService.getActiveCart(userId);
    return ApiResponse.success(res, 'Cart retrieved successfully', cart);
  } catch (err) {
    next(err);
  }
};

/**
 * Update item quantity in cart
 * PUT /api/cart/update
 */
const updateCart = async (req, res, next) => {
  try {
    const userId = req.body.userId || req.user?.id || 'demo_pos_user';
    const itemId = req.body.itemId || req.body.productId || req.params.itemId;
    const { quantity } = req.body;

    if (!itemId) {
      throw ApiError.badRequest('itemId or productId is required');
    }

    if (quantity === undefined || quantity === null) {
      throw ApiError.badRequest('quantity is required');
    }

    const cart = await cartService.updateCartItemQuantity(
      userId,
      itemId,
      parseInt(quantity, 10)
    );

    return ApiResponse.success(res, 'Cart updated successfully', cart);
  } catch (err) {
    next(err);
  }
};

/**
 * Remove an item from cart
 * DELETE /api/cart/remove
 */
const removeCartItem = async (req, res, next) => {
  try {
    const userId =
      req.body.userId || req.query.userId || req.user?.id || 'demo_pos_user';
    const itemId =
      req.body.itemId ||
      req.query.itemId ||
      req.params.itemId ||
      req.body.productId ||
      req.query.productId;

    if (!itemId) {
      throw ApiError.badRequest('itemId or productId is required to remove from cart');
    }

    const cart = await cartService.removeCartItem(userId, itemId);
    return ApiResponse.success(res, 'Item removed from cart successfully', cart);
  } catch (err) {
    next(err);
  }
};

/**
 * Clear user's active cart
 * DELETE /api/cart/clear/:userId or POST /api/cart/clear
 */
const clearCart = async (req, res, next) => {
  try {
    const userId =
      req.params.userId ||
      req.body.userId ||
      req.query.userId ||
      req.user?.id ||
      'demo_pos_user';
    const cart = await cartService.clearCart(userId);
    return ApiResponse.success(res, 'Cart cleared successfully', cart);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCart,
  removeCartItem,
  clearCart,
};
