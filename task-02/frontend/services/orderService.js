import api from './api';

export const orderService = {
  /**
   * Get authenticated customer's order history sorted newest first
   */
  getMyOrders: async () => {
    return await api.get('/orders/my-orders');
  },

  /**
   * Get order details by ID (enforcing ownership)
   * @param {string} id
   */
  getOrderById: async (id) => {
    return await api.get(`/orders/${id}`);
  },
};

export default orderService;
