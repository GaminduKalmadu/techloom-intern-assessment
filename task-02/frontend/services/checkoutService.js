import api from './api';

export const checkoutService = {
  /**
   * Initialize checkout and atomically reserve inventory for 5 minutes
   */
  createCheckout: async () => {
    return await api.post('/checkout');
  },

  /**
   * Get specific order details and linked reservation
   * @param {string} orderId
   */
  getCheckoutOrder: async (orderId) => {
    return await api.get(`/checkout/${orderId}`);
  },

  /**
   * Get active checkout reservation if one exists
   */
  getActiveCheckout: async () => {
    return await api.get('/checkout/active');
  },
};

export default checkoutService;
