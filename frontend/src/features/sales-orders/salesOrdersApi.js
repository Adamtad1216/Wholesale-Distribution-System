import api from '../../services/api';

export const salesOrdersApi = {
  preview: (payload) => api.post('/sales/orders/preview', payload),
  create: (payload) => api.post('/sales/orders', payload),
  createSalesRepOrder: (payload) => api.post('/sales/orders/sales-rep', payload),
  searchCustomers: (params) => api.get('/customers', { params }),
  list: (params) => api.get('/sales/orders', { params }),
  getById: (id) => api.get(`/sales/orders/${id}`),
  approve: (id) => api.post(`/sales/orders/${id}/approve`),
  reject: (id, reason) => api.post(`/sales/orders/${id}/reject`, { reason }),
  requestAdjustment: (id, reason) => api.post(`/sales/orders/${id}/request-adjustment`, { reason }),

  // Warehouse Scheduling
  getApprovedWarehouseOrders: (params) => api.get('/sales/orders/warehouse/approved', { params }),
  schedulePreparation: (id, payload) => api.post(`/sales/orders/warehouse/${id}/schedule-preparation`, payload),
  scheduleDelivery: (id, payload) => api.post(`/sales/orders/warehouse/${id}/schedule-delivery`, payload),

  // Storekeeper Preparation & Packing
  getStorekeeperTasks: (params) => api.get('/sales/orders/storekeeper/tasks', { params }),
  getStorekeeperTaskById: (id) => api.get(`/sales/orders/storekeeper/tasks/${id}`),
  markTaskPrepared: (id, items) => api.post(`/sales/orders/storekeeper/tasks/${id}/mark-prepared`, { items }),
  completeTask: (id) => api.post(`/sales/orders/storekeeper/tasks/${id}/complete`),

  // Driver Dispatch & Delivery Handover
  getDriverDeliveries: (params) => api.get('/sales/orders/driver/deliveries', { params }),
  getDriverDeliveryById: (id) => api.get(`/sales/orders/driver/deliveries/${id}`),
  startDelivery: (id) => api.post(`/sales/orders/driver/deliveries/${id}/start`),
  completeDelivery: (id, proof) => api.post(`/sales/orders/driver/deliveries/${id}/complete`, { proof }),
  customerConfirmHandover: (id, payload) => api.post(`/sales/orders/${id}/customer-confirm-handover`, payload),
  driverConfirmHandoverByOrderId: (id, payload) => api.post(`/sales/orders/${id}/driver-confirm-handover`, payload),

  // Dropdown Lookups
  getStorekeepers: () => api.get('/sales/orders/warehouse/storekeepers'),
  getDrivers: () => api.get('/sales/orders/warehouse/drivers'),
  getVehicles: () => api.get('/sales/orders/warehouse/vehicles'),

  // Invoice Payment Skip & Settlements
  skipInvoicePayment: (invoiceId) => api.post(`/invoices/${invoiceId}/skip-payment`),
  getInvoices: (params) => api.get('/invoices', { params }),
  getInvoiceById: (id) => api.get(`/invoices/${id}`),
};

