import api from './api';

/**
 * Authentication service communicating with Express backend auth endpoints
 */
export const authService = {
  /**
   * Register a new customer
   * @param {Object} data { name, email, password }
   */
  register: async ({ name, email, password }) => {
    return await api.post('/auth/register', { name, email, password });
  },

  /**
   * Log in an existing user
   * @param {Object} data { email, password }
   */
  login: async ({ email, password }) => {
    return await api.post('/auth/login', { email, password });
  },

  /**
   * Retrieve current user profile
   */
  getMe: async () => {
    return await api.get('/auth/me');
  },

  /**
   * Test admin authorization
   */
  adminCheck: async () => {
    return await api.get('/auth/admin-check');
  },
};

export default authService;
