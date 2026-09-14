import api from './api';

/**
 * Health check service communicating with Express backend
 */
export const healthService = {
  checkHealth: async () => {
    return await api.get('/health');
  },
};

export default healthService;
