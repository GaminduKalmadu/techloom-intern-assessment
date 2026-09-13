import api from './api';

/**
 * Fetch dashboard analytics from backend
 * @param {string} timeframe - 'today' | '7d' | '30d' | 'all'
 */
export const getDashboardAnalytics = async (timeframe = '7d') => {
  return await api.get('/analytics/dashboard', {
    params: { timeframe },
  });
};
