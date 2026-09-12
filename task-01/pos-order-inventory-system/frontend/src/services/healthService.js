import api from './api';

export const getSystemHealth = async () => {
  return await api.get('/health');
};
