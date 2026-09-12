const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const ApiError = require('../utils/apiError');

/**
 * Get active cart for user or create one if it does not exist
 */
const getActiveCart = async (userId) => {
  let cart = await Cart.findOne({ userId, status: 'active' }).populate('items.productId');
  if (!cart) {
    cart = await Cart.create({ userId, items: [], status: 'active' });
  }
  return cart;
};

/**
 * Add an item to the user's active cart
 */
const addItemToCart = async (userId, { productId, quantity = 1 }) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  if (product.stockQuantity < quantity) {
    throw ApiError.badRequest(
      `Insufficient stock for '${product.name}'. Available: ${product.stockQuantity}`
    );
  }

  let cart = await Cart.findOne({ userId, status: 'active' });
  if (!cart) {
    cart = new Cart({ userId, items: [], status: 'active' });
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId.toString()
  );

  if (existingItemIndex > -1) {
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    if (product.stockQuantity < newQuantity) {
      throw ApiError.badRequest(
        `Cannot add more '${product.name}'. Total requested: ${newQuantity}, Available: ${product.stockQuantity}`
      );
    }
    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].price = product.price; // Update to current price
  } else {
    cart.items.push({
      productId,
      quantity,
      price: product.price,
    });
  }

  await cart.save();
  return cart.populate('items.productId');
};

/**
 * Update quantity of a specific cart item
 */
const updateCartItemQuantity = async (userId, itemId, quantity) => {
  const cart = await Cart.findOne({ userId, status: 'active' });
  if (!cart) {
    throw ApiError.notFound('Active cart not found');
  }

  const item = cart.items.id(itemId);
  if (!item) {
    throw ApiError.notFound('Item not found in cart');
  }

  if (quantity <= 0) {
    item.deleteOne();
  } else {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw ApiError.notFound('Referenced product no longer exists');
    }
    if (product.stockQuantity < quantity) {
      throw ApiError.badRequest(
        `Insufficient stock for '${product.name}'. Available: ${product.stockQuantity}`
      );
    }
    item.quantity = quantity;
    item.price = product.price;
  }

  await cart.save();
  return cart.populate('items.productId');
};

/**
 * Remove an item from the cart
 */
const removeCartItem = async (userId, itemId) => {
  const cart = await Cart.findOne({ userId, status: 'active' });
  if (!cart) {
    throw ApiError.notFound('Active cart not found');
  }

  const item = cart.items.id(itemId);
  if (!item) {
    throw ApiError.notFound('Item not found in cart');
  }

  item.deleteOne();
  await cart.save();
  return cart.populate('items.productId');
};

/**
 * Clear all items from active cart
 */
const clearCart = async (userId) => {
  const cart = await Cart.findOne({ userId, status: 'active' });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  return cart;
};

module.exports = {
  getActiveCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};
