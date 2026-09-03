import api from '../../services/api';

export const salesOrdersApi = {
  preview: (payload) => api.post('/sales/orders/preview', payload),
  create: (payload) => api.post('/sales/orders', payload),
  list: (params) => api.get('/sales/orders', { params }),
  getById: (id) => api.get(`/sales/orders/${id}`),
  approve: (id) => api.post(`/sales/orders/${id}/approve`),
  reject: (id, reason) => api.post(`/sales/orders/${id}/reject`, { reason }),
  requestAdjustment: (id, reason) => api.post(`/sales/orders/${id}/request-adjustment`, { reason }),
};
