import api from './api';

/**
 * Fetch paginated products with optional filters
 * @param {object} params - query parameters (search, category, status, minPrice, maxPrice, page, limit, sortBy, sortOrder)
 */
export const getProducts = async (params = {}) => {
  return await api.get('/products', { params });
};

/**
 * Fetch inventory summary statistics for dashboard cards
 * @param {number} lowStockThreshold
 */
export const getProductStats = async (lowStockThreshold = 10) => {
  return await api.get('/products/stats', {
    params: { lowStockThreshold },
  });
};

/**
 * Get single product by ID
 * @param {string} id
 */
export const getProductById = async (id) => {
  return await api.get(`/products/${id}`);
};

/**
 * Create a new product
 * @param {object} productData
 */
export const createProduct = async (productData) => {
  return await api.post('/products', productData);
};

/**
 * Update an existing product
 * @param {string} id
 * @param {object} productData
 */
export const updateProduct = async (id, productData) => {
  return await api.put(`/products/${id}`, productData);
};

/**
 * Delete a product by ID
 * @param {string} id
 */
export const deleteProduct = async (id) => {
  return await api.delete(`/products/${id}`);
};

/**
 * Quick adjust stock quantity (positive or negative delta)
 * @param {string} id
 * @param {number} quantityDelta
 */
export const adjustProductStock = async (id, quantityDelta) => {
  return await api.patch(`/products/${id}/stock`, { quantityDelta });
};

/**
 * Seed sample retail products
 * @param {boolean} force
 */
export const seedSampleProducts = async (force = false) => {
  return await api.post('/products/seed', null, {
    params: { force },
  });
};

export const seedProducts = seedSampleProducts;
