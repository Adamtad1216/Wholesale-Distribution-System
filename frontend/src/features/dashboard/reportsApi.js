import api from '../../services/api';

export const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getSalesReport: (params) => api.get('/reports/sales', { params }),
  getProductSalesReport: (params) => api.get('/reports/sales/products', { params }),
  getCustomerReport: (params) => api.get('/reports/customers', { params }),
  getSalesRepReport: (params) => api.get('/reports/sales-representatives', { params }),
  getOrderStatusReport: () => api.get('/reports/orders/status'),
  getWarehouseReport: () => api.get('/reports/warehouse'),
  getDeliveryReport: (params) => api.get('/reports/deliveries', { params }),
};
