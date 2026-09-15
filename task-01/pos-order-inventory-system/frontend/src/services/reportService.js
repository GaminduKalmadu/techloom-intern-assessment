import api from './api';

/**
 * Fetch sales and revenue report
 * @param {Object} params - { timeframe, startDate, endDate, status }
 */
export const getSalesReport = async (params = {}) => {
  return await api.get('/reports/sales', { params });
};

/**
 * Fetch inventory valuation & health report
 * @param {Object} params - { category, stockStatus, lowStockThreshold }
 */
export const getInventoryReport = async (params = {}) => {
  return await api.get('/reports/inventory', { params });
};

/**
 * Fetch top-selling products report
 * @param {Object} params - { limit, startDate, endDate }
 */
export const getTopProductsReport = async (params = {}) => {
  return await api.get('/reports/top-products', { params });
};

/**
 * Download CSV or JSON report directly
 * @param {Object} params - { type: 'sales'|'inventory', format: 'csv'|'json', ... }
 */
export const downloadReportFile = async (params = {}) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  const query = new URLSearchParams(params).toString();
  const downloadUrl = `${baseURL}/reports/export?${query}`;
  window.open(downloadUrl, '_blank');
};
