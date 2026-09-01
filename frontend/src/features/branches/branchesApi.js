import api from '../../services/api';

export const branchesApi = {
  getBranches: (params) => api.get('/branches', { params }),
  getBranchById: (id) => api.get(`/branches/${id}`),
  createBranch: (data) => api.post('/branches', data),
  updateBranch: (id, data) => api.patch(`/branches/${id}`, data),
  deleteBranch: (id) => api.delete(`/branches/${id}`),
};
