const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const ApiError = require('../utils/apiError');

/**
 * Calculate totals and format cart
 */
const formatCartResponse = (cart) => {
  const plain = cart.toObject ? cart.toObject() : cart;
  let subtotal = 0;
  let totalItems = 0;

  if (plain.items && Array.isArray(plain.items)) {
    for (const item of plain.items) {
      const itemPrice = item.price || (item.productId && item.productId.price) || 0;
      subtotal += itemPrice * item.quantity;
      totalItems += item.quantity;
    }
  }

  plain.subtotal = Math.round(subtotal * 100) / 100;
  plain.totalItems = totalItems;
  return plain;
};

/**
 * Get active cart for user or create one if it does not exist
 */
const getActiveCart = async (userId) => {
  let cart = await Cart.findOne({ userId, status: 'active' }).populate('items.productId');
  if (!cart) {
    cart = await Cart.create({ userId, items: [], status: 'active' });
    await cart.populate('items.productId');
  }
  return formatCartResponse(cart);
};

/**
 * Add an item to the user's active cart
 */
const addItemToCart = async (userId, { productId, quantity = 1 }) => {
  const numQuantity = Math.max(1, parseInt(quantity, 10) || 1);
  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  if (product.stockQuantity < numQuantity) {
    throw ApiError.badRequest(
      `Insufficient stock for '${product.name}'. Available: ${product.stockQuantity}`
    );
  }

  let cart = await Cart.findOne({ userId, status: 'active' });
  if (!cart) {
    cart = new Cart({ userId, items: [], status: 'active' });
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId && item.productId.toString() === productId.toString()
  );

  if (existingItemIndex > -1) {
    const newQuantity = cart.items[existingItemIndex].quantity + numQuantity;
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
      quantity: numQuantity,
      price: product.price,
    });
  }

  await cart.save();
  await cart.populate('items.productId');
  return formatCartResponse(cart);
};

/**
 * Update quantity of a specific cart item (supports itemId or productId)
 */
const updateCartItemQuantity = async (userId, itemId, quantity) => {
  const cart = await Cart.findOne({ userId, status: 'active' });
  if (!cart) {
    throw ApiError.notFound('Active cart not found');
  }

  const numQuantity = parseInt(quantity, 10);
  if (isNaN(numQuantity)) {
    throw ApiError.badRequest('Valid quantity is required');
  }

  // Find item by cart subdocument _id or productId
  const item =
    cart.items.id(itemId) ||
    cart.items.find(
      (it) => it.productId && it.productId.toString() === itemId.toString()
    );

  if (!item) {
    throw ApiError.notFound('Item not found in cart');
  }

  if (numQuantity <= 0) {
    const itemIndex = cart.items.findIndex(
      (it) => it._id.toString() === item._id.toString()
    );
    if (itemIndex > -1) {
      cart.items.splice(itemIndex, 1);
    }
  } else {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw ApiError.notFound('Referenced product no longer exists');
    }
    if (product.stockQuantity < numQuantity) {
      throw ApiError.badRequest(
        `Insufficient stock for '${product.name}'. Available: ${product.stockQuantity}`
      );
    }
    item.quantity = numQuantity;
    item.price = product.price;
  }

  await cart.save();
  await cart.populate('items.productId');
  return formatCartResponse(cart);
};

/**
 * Remove an item from the cart (supports itemId or productId)
 */
const removeCartItem = async (userId, itemId) => {
  const cart = await Cart.findOne({ userId, status: 'active' });
  if (!cart) {
    throw ApiError.notFound('Active cart not found');
  }

  const itemIndex = cart.items.findIndex(
    (item) =>
      item._id.toString() === itemId.toString() ||
      (item.productId && item.productId.toString() === itemId.toString())
  );

  if (itemIndex === -1) {
    throw ApiError.notFound('Item not found in cart');
  }

  cart.items.splice(itemIndex, 1);
  await cart.save();
  await cart.populate('items.productId');
  return formatCartResponse(cart);
};

/**
 * Clear all items from active cart
 */
const clearCart = async (userId) => {
  const cart = await Cart.findOne({ userId, status: 'active' });
  if (cart) {
    cart.items = [];
    await cart.save();
    return formatCartResponse(cart);
  }
  return { items: [], subtotal: 0, totalItems: 0 };
};

module.exports = {
  getActiveCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};
