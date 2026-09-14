import api from './api';

export const cartService = {
  /**
   * Get active cart for current user
   */
  getCart: async () => {
    return await api.get('/cart');
  },

  /**
   * Add item to active cart
   */
  addItem: async (productId, quantity = 1) => {
    return await api.post('/cart/items', { productId, quantity });
  },

  /**
   * Update item quantity in active cart
   */
  updateItemQuantity: async (productId, quantity) => {
    return await api.put(`/cart/items/${productId}`, { quantity });
  },

  /**
   * Remove specific item from active cart
   */
  removeItem: async (productId) => {
    return await api.delete(`/cart/items/${productId}`);
  },

  /**
   * Clear all items from active cart
   */
  clearCart: async () => {
    return await api.delete('/cart');
  },
};

export default cartService;
