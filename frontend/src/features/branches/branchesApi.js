import api from '../../services/api';

export const branchesApi = {
  // Branches CRUD
  getBranches: (params) => api.get('/branches', { params }),
  getBranchById: (id) => api.get(`/branches/${id}`),
  createBranch: (data) => api.post('/branches', data),
  updateBranch: (id, data) => api.patch(`/branches/${id}`, data),
  deleteBranch: (id) => api.delete(`/branches/${id}`),

  // Warehouses CRUD
  getWarehouses: (params) => api.get('/warehouses', { params }),
  getWarehouseById: (id) => api.get(`/warehouses/${id}`),
  createWarehouse: (data) => api.post('/warehouses', data),
  updateWarehouse: (id, data) => api.patch(`/warehouses/${id}`, data),
  deleteWarehouse: (id) => api.delete(`/warehouses/${id}`),

  // Regions CRUD & Lookup
  getRegions: (params) => api.get('/regions', { params }),
  getRegionById: (id) => api.get(`/regions/${id}`),
  createRegion: (data) => api.post('/regions', data),
  updateRegion: (id, data) => api.patch(`/regions/${id}`, data),
  deleteRegion: (id) => api.delete(`/regions/${id}`),

  // Lookups & Management
  getCompanies: (params) => api.get('/companies', { params }),
  getEmployees: (params) => api.get('/employees', { params }),
  getEligibleWarehouseManagers: () => api.get('/warehouses/eligible-managers'),
  assignWarehouseManager: (warehouseId, data) => api.post(`/warehouses/${warehouseId}/assign-manager`, data),
  getEligibleBranchManagers: () => api.get('/branches/eligible-managers'),
  assignBranchManager: (branchId, data) => api.post(`/branches/${branchId}/assign-manager`, data),
};
