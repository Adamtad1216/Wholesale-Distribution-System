import api from '../../services/api';

export const inventoryApi = {
  // ── Warehouse Stocks ──────────────────────────────────────
  getStocks: (params) => api.get('/inventory/stocks', { params }),
  getStockById: (id) => api.get(`/inventory/stocks/${id}`),
  createStock: (data) => api.post('/inventory/stocks', data),
  updateStock: (id, data) => api.patch(`/inventory/stocks/${id}`, data),
  deleteStock: (id) => api.delete(`/inventory/stocks/${id}`),
  getStockMovements: (params) => api.get('/inventory/stocks/movements', { params }),

  // ── Stock Adjustments ─────────────────────────────────────
  getAdjustments: (params) => api.get('/inventory/adjustments', { params }),
  getAdjustmentById: (id) => api.get(`/inventory/adjustments/${id}`),
  createAdjustment: (data) => api.post('/inventory/adjustments', data),
  updateAdjustment: (id, data) => api.patch(`/inventory/adjustments/${id}`, data),
  approveAdjustment: (id, data) => api.patch(`/inventory/adjustments/${id}/approve`, data),
  deleteAdjustment: (id) => api.delete(`/inventory/adjustments/${id}`),
  addAdjustmentItem: (id, data) => api.post(`/inventory/adjustments/${id}/items`, data),
  updateAdjustmentItem: (id, itemId, data) => api.patch(`/inventory/adjustments/${id}/items/${itemId}`, data),
  removeAdjustmentItem: (id, itemId) => api.delete(`/inventory/adjustments/${id}/items/${itemId}`),

  // ── Stock Transfers ───────────────────────────────────────
  getTransfers: (params) => api.get('/inventory/transfers', { params }),
  getTransferById: (id) => api.get(`/inventory/transfers/${id}`),
  createTransfer: (data) => api.post('/inventory/transfers', data),
  updateTransfer: (id, data) => api.patch(`/inventory/transfers/${id}`, data),
  approveTransfer: (id, data) => api.patch(`/inventory/transfers/${id}/approve`, data),
  deleteTransfer: (id) => api.delete(`/inventory/transfers/${id}`),

  // ── Stock Reservations ────────────────────────────────────
  getReservations: (params) => api.get('/inventory/reservations', { params }),
  getReservationById: (id) => api.get(`/inventory/reservations/${id}`),
  createReservation: (data) => api.post('/inventory/reservations', data),
  approveReservation: (id, data) => api.patch(`/inventory/reservations/${id}/approve`, data),
  releaseReservation: (id, data) => api.post(`/inventory/reservations/${id}/release`, data),
  deleteReservation: (id) => api.delete(`/inventory/reservations/${id}`),

  // ── Lookups ───────────────────────────────────────────────
  getWarehouses: (params) => api.get('/warehouses', { params }),
  getProducts: (params) => api.get('/catalog/products', { params }),
  getSalesOrders: (params) => api.get('/sales/orders', { params }),
};

export default inventoryApi;
