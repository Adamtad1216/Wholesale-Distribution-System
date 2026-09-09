import api from '../../services/api';

export const MOCK_SUPPLIERS = [];

export const suppliersApi = {
  // Get all suppliers from backend database
  getSuppliers: async (params = {}) => {
    try {
      const res = await api.get('/suppliers', { params });
      const suppliersList = Array.isArray(res?.data)
        ? res.data
        : (res?.data?.suppliers || res?.suppliers || []);
      return { data: suppliersList, total: res?.data?.total || suppliersList.length };
    } catch (err) {
      console.error('Failed to fetch suppliers from backend:', err);
      return { data: [], total: 0 };
    }
  },

  // Get supplier by ID from backend database
  getSupplierById: async (id) => {
    try {
      const res = await api.get(`/suppliers/${id}`);
      return { data: res?.data?.data || res?.data || res };
    } catch (err) {
      console.error(`Failed to fetch supplier ${id} from backend:`, err);
      return { data: null };
    }
  },

  // Create new supplier in backend database
  createSupplier: async (payload) => {
    const res = await api.post('/suppliers', payload);
    return res?.data?.data || res?.data;
  },

  // Update supplier in backend database
  updateSupplier: async (id, payload) => {
    const res = await api.put(`/suppliers/${id}`, payload);
    return res?.data?.data || res?.data;
  },

  // Archive supplier in backend database
  archiveSupplier: async (id) => {
    const res = await api.delete(`/suppliers/${id}`);
    return res?.data;
  },
};
