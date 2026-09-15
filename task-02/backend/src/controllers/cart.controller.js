const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * Helper to calculate subtotal, itemCount, and format populated cart items
 */
const formatCartResponse = (cart) => {
  let subtotal = 0;
  let itemCount = 0;

  const validItems = [];

  for (const item of cart.items) {
    if (!item.productId) continue;

    const prod = item.productId;
    const price = typeof prod.price === 'number' ? prod.price : 0;
    const lineTotal = Number((price * item.quantity).toFixed(2));

    subtotal += lineTotal;
    itemCount += item.quantity;

    validItems.push({
      productId: prod._id,
      product: {
        _id: prod._id,
        name: prod.name,
        price: prod.price,
        imageUrl: prod.imageUrl,
        categoryId: prod.categoryId,
        isActive: prod.isActive,
        availableStock: prod.availableStock,
      },
      quantity: item.quantity,
      unitPrice: prod.price,
      lineTotal,
    });
  }

  return {
    _id: cart._id,
    userId: cart.userId,
    status: cart.status,
    items: validItems,
    subtotal: Number(subtotal.toFixed(2)),
    itemCount,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
};

/**
 * @desc    Get active cart for authenticated user
 * @route   GET /api/cart
 * @access  Protected (Customer / Admin)
 */
const getCart = async (req, res, next) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOne({ userId, status: 'ACTIVE' }).populate({
      path: 'items.productId',
      select: 'name price imageUrl categoryId isActive stockQuantity reservedQuantity availableStock',
    });

    if (!cart) {
      cart = await Cart.create({ userId, items: [], status: 'ACTIVE' });
    } else {
      // Remove any items where product was completely deleted
      const originalCount = cart.items.length;
      cart.items = cart.items.filter((item) => item.productId != null);
      if (cart.items.length !== originalCount) {
        await cart.save();
      }
    }

    const formattedCart = formatCartResponse(cart);

    return ApiResponse.success(res, 'Cart retrieved successfully.', { cart: formattedCart }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add item to active cart
 * @route   POST /api/cart/items
 * @access  Protected (Customer / Admin)
 */
const addItem = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      throw ApiError.badRequest('A valid product ID is required.');
    }

    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 1) {
      throw ApiError.badRequest('Quantity must be a positive integer.');
    }

    // Product must exist in DB
    const product = await Product.findById(productId);
    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    // Product must be active
    if (!product.isActive) {
      throw ApiError.badRequest('Product is currently inactive and cannot be added to cart.');
    }

    // NOTE: Cart does NOT reserve stock. reservedQuantity is NOT changed here.

    let cart = await Cart.findOne({ userId, status: 'ACTIVE' });
    if (!cart) {
      cart = new Cart({ userId, items: [], status: 'ACTIVE' });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (itemIndex > -1) {
      // Add to existing quantity
      cart.items[itemIndex].quantity += qtyNum;
    } else {
      // Add new line item
      cart.items.push({ productId: product._id, quantity: qtyNum });
    }

    await cart.save();

    await cart.populate({
      path: 'items.productId',
      select: 'name price imageUrl categoryId isActive stockQuantity reservedQuantity availableStock',
    });

    const formattedCart = formatCartResponse(cart);

    return ApiResponse.success(res, 'Product added to cart successfully.', { cart: formattedCart }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update quantity of an item in cart
 * @route   PUT /api/cart/items/:productId
 * @access  Protected (Customer / Admin)
 */
const updateItemQuantity = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      throw ApiError.badRequest('A valid product ID is required.');
    }

    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 1) {
      throw ApiError.badRequest('Quantity must be a positive integer.');
    }

    const cart = await Cart.findOne({ userId, status: 'ACTIVE' });
    if (!cart) {
      throw ApiError.notFound('Cart not found.');
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      throw ApiError.notFound('Product not found in cart.');
    }

    // Verify product is still active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw ApiError.badRequest('Product is inactive or no longer available.');
    }

    cart.items[itemIndex].quantity = qtyNum;
    await cart.save();

    await cart.populate({
      path: 'items.productId',
      select: 'name price imageUrl categoryId isActive stockQuantity reservedQuantity availableStock',
    });

    const formattedCart = formatCartResponse(cart);

    return ApiResponse.success(
      res,
      'Cart item quantity updated successfully.',
      { cart: formattedCart },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove an item from active cart
 * @route   DELETE /api/cart/items/:productId
 * @access  Protected (Customer / Admin)
 */
const removeItem = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      throw ApiError.badRequest('A valid product ID is required.');
    }

    const cart = await Cart.findOne({ userId, status: 'ACTIVE' });
    if (!cart) {
      throw ApiError.notFound('Cart not found.');
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => item.productId.toString() !== productId.toString());

    if (cart.items.length === initialLength) {
      throw ApiError.notFound('Product not found in cart.');
    }

    await cart.save();

    await cart.populate({
      path: 'items.productId',
      select: 'name price imageUrl categoryId isActive stockQuantity reservedQuantity availableStock',
    });

    const formattedCart = formatCartResponse(cart);

    return ApiResponse.success(res, 'Item removed from cart.', { cart: formattedCart }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear all items from active cart
 * @route   DELETE /api/cart
 * @access  Protected (Customer / Admin)
 */
const clearCart = async (req, res, next) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOne({ userId, status: 'ACTIVE' });
    if (!cart) {
      cart = await Cart.create({ userId, items: [], status: 'ACTIVE' });
    } else {
      cart.items = [];
      await cart.save();
    }

    const formattedCart = formatCartResponse(cart);

    return ApiResponse.success(res, 'Cart cleared successfully.', { cart: formattedCart }, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
};
