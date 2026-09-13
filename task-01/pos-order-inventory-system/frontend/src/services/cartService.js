import api from './api';

/**
 * Fetch active cart for a specific user
 * @param {string} userId
 */
export const getCart = async (userId) => {
  return await api.get(`/cart/${userId}`);
};

/**
 * Add an item to user's cart
 * @param {object} params
 * @param {string} params.productId
 * @param {number} [params.quantity]
 * @param {string} [params.userId]
 */
export const addToCart = async ({ productId, quantity = 1, userId }) => {
  return await api.post('/cart/add', {
    productId,
    quantity,
    userId,
  });
};

/**
 * Update quantity of a cart item
 * @param {object} params
 * @param {string} params.itemId
 * @param {number} params.quantity
 * @param {string} [params.userId]
 */
export const updateCartItem = async ({ itemId, quantity, userId }) => {
  return await api.put('/cart/update', {
    itemId,
    quantity,
    userId,
  });
};

/**
 * Remove an item from the cart
 * @param {object} params
 * @param {string} params.itemId
 * @param {string} [params.userId]
 */
export const removeCartItem = async ({ itemId, userId }) => {
  return await api.delete('/cart/remove', {
    data: { itemId, userId },
  });
};

/**
 * Clear all items from cart
 * @param {string} userId
 */
export const clearCart = async (userId) => {
  return await api.delete(`/cart/clear/${userId}`);
};
