import api from './api';

/**
 * Create a new order with stock reservation
 * @param {object} orderData
 * @param {string} [orderData.userId]
 * @param {Array} [orderData.items]
 * @param {string} [orderData.notes]
 * @param {boolean} [orderData.fromCart]
 */
export const createOrder = async (orderData) => {
  return await api.post('/orders/create', orderData);
};

/**
 * Fetch paginated orders with optional status filters
 * @param {object} params
 */
export const getOrders = async (params = {}) => {
  return await api.get('/orders', { params });
};

/**
 * Fetch a single order by ID
 * @param {string} id
 */
export const getOrderById = async (id) => {
  return await api.get(`/orders/${id}`);
};

/**
 * Mark order as PAID
 * @param {string} id
 * @param {object} paymentData
 */
/**
 * Cancel order and release reserved stock
 * @param {string} id
 * @param {string} [reason]
 */
export const cancelOrder = async (id, reason = 'User requested cancellation') => {
  return await api.post(`/orders/${id}/cancel`, { reason });
};
