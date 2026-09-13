import api from './api';

export const processPayment = (paymentData, idempotencyKey) =>
  api.post('/payments/process', paymentData, { headers: { 'Idempotency-Key': idempotencyKey } });

export const getPayments = (params = {}) => api.get('/payments', { params });
export const getPaymentById = (id) => api.get(`/payments/${id}`);
