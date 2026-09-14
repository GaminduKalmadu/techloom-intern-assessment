import api from './api';

export const productService = {
  getProducts: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    return await api.get(endpoint);
  },

  getProductById: async (id) => {
    return await api.get(`/products/${id}`);
  },

  getInventoryStats: async () => {
    return await api.get('/products/stats');
  },

  createProduct: async (data) => {
    return await api.post('/products', data);
  },

  updateProduct: async (id, data) => {
    return await api.put(`/products/${id}`, data);
  },

  deleteProduct: async (id, hard = false) => {
    const endpoint = hard ? `/products/${id}?hard=true` : `/products/${id}`;
    return await api.delete(endpoint);
  },
};

export default productService;
