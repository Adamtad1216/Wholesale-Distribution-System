import api from '../../services/api';

export const procurementApi = {
  // ── Products (strictly from database) ────────────────────────
  getProducts: async (params) => {
    try {
      const res = await api.get('/catalog/products', { params: { limit: 100, ...params } });
      const raw = res?.data?.data || res?.data?.products || res?.data || [];
      const list = Array.isArray(raw) ? raw : (raw.products || []);
      return { data: list };
    } catch (e) {
      console.error('Failed to fetch products from backend database:', e);
      return { data: [] };
    }
  },

  // ── Reference Data (strictly from database) ──────────────────
  getCategories: async () => {
    try {
      const res = await api.get('/catalog/categories');
      const list = Array.isArray(res?.data?.data)
        ? res.data.data
        : (Array.isArray(res?.data) ? res.data : []);
      return { data: list };
    } catch (e) {
      console.error('Failed to fetch categories from database:', e);
      return { data: [] };
    }
  },

  getSuppliers: async () => {
    try {
      const res = await api.get('/suppliers');
      const list = Array.isArray(res?.data?.data)
        ? res.data.data
        : (Array.isArray(res?.data) ? res.data : []);
      return { data: list };
    } catch (e) {
      console.error('Failed to fetch suppliers from database:', e);
      return { data: [] };
    }
  },

  getWarehouses: async () => {
    try {
      const res = await api.get('/warehouses');
      const list = Array.isArray(res?.data?.data)
        ? res.data.data
        : (Array.isArray(res?.data) ? res.data : []);
      return { data: list };
    } catch (e) {
      console.error('Failed to fetch warehouses from database:', e);
      return { data: [] };
    }
  },

  getSalesOrders: (params) => api.get('/sales/orders', { params }),

  // ── Purchase Orders ─────────────────────────────────────────
  getPurchaseOrders: (params) => api.get('/purchase-orders', { params }),
  getPurchaseOrderById: (id) => api.get(`/purchase-orders/${id}`),
  createPurchaseOrder: (data) => api.post('/purchase-orders', data),
  approvePurchaseOrder: (id) => api.patch(`/purchase-orders/${id}/approve`),
  rejectPurchaseOrder: (id, data) => api.patch(`/purchase-orders/${id}/status`, { status: 'REJECTED', ...data }),

  // ── Goods Receipts ──────────────────────────────────────────
  getGoodsReceipts: (params) => api.get('/goods-receipts', { params }),
  getGoodsReceiptById: (id) => api.get(`/goods-receipts/${id}`),
  createGoodsReceipt: (data) => api.post('/goods-receipts', data),
  approveGoodsReceipt: (id, paymentData) => api.patch(`/goods-receipts/${id}/approve`, paymentData),
  rejectGoodsReceipt: (id, data) => api.patch(`/goods-receipts/${id}/status`, { status: 'REJECTED', ...data }),

  // ── Evidence Upload & Payment Providers ───────────────────
  getPaymentProviders: () => api.get('/payments/providers'),
  uploadEvidence: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};
