import api from '../../services/api';

export const productsApi = {
  // ── Products ──────────────────────────────────────────────
  getProducts: (params) => api.get('/catalog/products', { params }),
  getProductById: (id) => api.get(`/catalog/products/${id}`),
  getProduct: (id) => api.get(`/catalog/products/${id}`),
  createProduct: (data) => api.post('/catalog/products', data),
  updateProduct: (id, data) => api.patch(`/catalog/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/catalog/products/${id}`),
  addProductImage: (id, data) => api.post(`/catalog/products/${id}/images`, data),
  removeProductImage: (id, imageId) => api.delete(`/catalog/products/${id}/images/${imageId}`),
  uploadProductImage: (file, folder = 'Products') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return api.post('/documents/upload', formData);
  },

  // ── Categories ────────────────────────────────────────────
  getCategories: (params) => api.get('/catalog/categories', { params }),
  getCategoryById: (id) => api.get(`/catalog/categories/${id}`),
  getCategory: (id) => api.get(`/catalog/categories/${id}`),
  createCategory: (data) => api.post('/catalog/categories', data),
  updateCategory: (id, data) => api.patch(`/catalog/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/catalog/categories/${id}`),

  // ── Brands ────────────────────────────────────────────────
  getBrands: (params) => api.get('/catalog/brands', { params }),
  getBrandById: (id) => api.get(`/catalog/brands/${id}`),
  getBrand: (id) => api.get(`/catalog/brands/${id}`),
  createBrand: (data) => api.post('/catalog/brands', data),
  updateBrand: (id, data) => api.patch(`/catalog/brands/${id}`, data),
  deleteBrand: (id) => api.delete(`/catalog/brands/${id}`),

  // ── Units ─────────────────────────────────────────────────
  getUnits: (params) => api.get('/catalog/units', { params }),
  getUnitById: (id) => api.get(`/catalog/units/${id}`),
  getUnit: (id) => api.get(`/catalog/units/${id}`),
  createUnit: (data) => api.post('/catalog/units', data),
  updateUnit: (id, data) => api.patch(`/catalog/units/${id}`, data),
  deleteUnit: (id) => api.delete(`/catalog/units/${id}`),

  // ── Warehouse Selling Prices ──────────────────────────────
  getWarehouseSellingPrices: (params) => api.get('/catalog/warehouse-selling-prices', { params }),
  createWarehouseSellingPrice: (data) => api.post('/catalog/warehouse-selling-prices', data),
  updateWarehouseSellingPrice: (id, data) => api.patch(`/catalog/warehouse-selling-prices/${id}`, data),
  deleteWarehouseSellingPrice: (id) => api.delete(`/catalog/warehouse-selling-prices/${id}`),

  // ── Warehouses Helper ─────────────────────────────────────
  getWarehouses: (params) => api.get('/warehouses', { params }),
};

export default productsApi;
