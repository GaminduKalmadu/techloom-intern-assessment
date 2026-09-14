import api from './api';

export const categoryService = {
  getCategories: async () => {
    return await api.get('/categories');
  },

  createCategory: async (data) => {
    return await api.post('/categories', data);
  },

  updateCategory: async (id, data) => {
    return await api.put(`/categories/${id}`, data);
  },

  deleteCategory: async (id) => {
    return await api.delete(`/categories/${id}`);
  },
};

export default categoryService;
