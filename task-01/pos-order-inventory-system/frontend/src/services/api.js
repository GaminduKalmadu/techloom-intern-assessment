import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach JWT Token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pos_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Format error payloads & handle 401 unauthenticated
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const customError = {
      message: error.response?.data?.message || error.message || 'Something went wrong',
      status: error.response?.status || 500,
      errors: error.response?.data?.errors || null,
      code: error.response?.data?.code || null,
    };

    // Auto-logout on 401 Unauthorized if needed in future
    if (customError.status === 401 && localStorage.getItem('pos_token')) {
      localStorage.removeItem('pos_token');
      // Optional: window.location.href = '/login';
    }

    return Promise.reject(customError);
  }
);

export default api;
