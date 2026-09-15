import api from './api';

export const adminService = {
  /**
   * Get operational metrics for the admin dashboard
   */
  getDashboardMetrics: async () => {
    return await api.get('/admin/dashboard');
  },

  /**
   * Get list of all orders with filters
   * @param {Object} [params]
   * @param {string} [params.orderStatus]
   * @param {string} [params.paymentStatus]
   * @param {string} [params.search]
   * @param {number} [params.page]
   * @param {number} [params.limit]
   */
  getOrders: async (params = {}) => {
    return await api.get('/admin/orders', { params });
  },

  /**
   * Get complete order details by ID for admin
   * @param {string} id
   */
  getOrderById: async (id) => {
    return await api.get(`/admin/orders/${id}`);
  },

  /**
   * Get payments ledger with optional filter
   * @param {Object} [params]
   * @param {string} [params.status]
   * @param {number} [params.page]
   * @param {number} [params.limit]
   */
  getPayments: async (params = {}) => {
    return await api.get('/admin/payments', { params });
  },

  /**
   * Get refunds ledger with optional filter
   * @param {Object} [params]
   * @param {string} [params.status]
   * @param {number} [params.page]
   * @param {number} [params.limit]
   */
  getRefunds: async (params = {}) => {
    return await api.get('/admin/refunds', { params });
  },
};

export default adminService;
