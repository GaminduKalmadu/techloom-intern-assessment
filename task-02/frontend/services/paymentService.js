import api from './api';

export const paymentService = {
  /**
   * Process mock payment for an active reserved order
   * @param {Object} paymentData
   * @param {string} paymentData.orderId
   * @param {string} paymentData.idempotencyKey
   * @param {string} paymentData.cardNumber
   * @param {string} [paymentData.cardholderName]
   * @param {string} [paymentData.expiryDate]
   * @param {string} [paymentData.cvv]
   */
  processPayment: async (paymentData) => {
    return await api.post('/payments', paymentData);
  },

  /**
   * Get payment details for an order
   * @param {string} orderId
   */
  getPaymentByOrder: async (orderId) => {
    return await api.get(`/payments/order/${orderId}`);
  },
};

export default paymentService;
