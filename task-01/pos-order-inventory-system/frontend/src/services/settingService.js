import api from './api';

/**
 * Fetch POS system settings
 */
export const getSettings = async () => {
  return await api.get('/settings');
};

/**
 * Update POS system settings
 * @param {Object} data
 */
export const updateSettings = async (data) => {
  return await api.put('/settings', data);
};

/**
 * Reset POS system settings to factory defaults
 */
export const resetSettings = async () => {
  return await api.post('/settings/reset');
};
