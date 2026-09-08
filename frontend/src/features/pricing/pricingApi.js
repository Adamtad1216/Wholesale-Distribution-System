import api from '../../services/api';

export const priceTiersApi = {
  list: (params) => api.get('/pricing/tiers', { params }),
  getById: (id) => api.get(`/pricing/tiers/${id}`),
  create: (data) => api.post('/pricing/tiers', data),
  update: (id, data) => api.patch(`/pricing/tiers/${id}`, data),
  activate: (id) => api.post(`/pricing/tiers/${id}/activate`),
  deactivate: (id) => api.post(`/pricing/tiers/${id}/deactivate`),
  delete: (id) => api.delete(`/pricing/tiers/${id}`),
};

export const productPricesApi = {
  list: (params) => api.get('/pricing/product-prices', { params }),
  getById: (id) => api.get(`/pricing/product-prices/${id}`),
  create: (data) => api.post('/pricing/product-prices', data),
  createBatch: (data) => api.post('/pricing/product-prices/batch', data),
  update: (id, data) => api.patch(`/pricing/product-prices/${id}`, data),
  delete: (id) => api.delete(`/pricing/product-prices/${id}`),
};

export const discountRulesApi = {
  list: (params) => api.get('/pricing/discounts', { params }),
  getById: (id) => api.get(`/pricing/discounts/${id}`),
  create: (data) => api.post('/pricing/discounts', data),
  update: (id, data) => api.patch(`/pricing/discounts/${id}`, data),
  delete: (id) => api.delete(`/pricing/discounts/${id}`),
};

export const salesQuotasApi = {
  list: (params) => api.get('/pricing/quotas', { params }),
  getById: (id) => api.get(`/pricing/quotas/${id}`),
  create: (data) => api.post('/pricing/quotas', data),
  update: (id, data) => api.patch(`/pricing/quotas/${id}`, data),
  delete: (id) => api.delete(`/pricing/quotas/${id}`),
  getConsumption: (params) => api.get('/pricing/quotas/consumption', { params }),
};
