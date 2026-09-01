import api from '../../services/api';

export const rolesApi = {
  getRoles: (params) => api.get('/roles', { params }),
  getRoleById: (id) => api.get(`/roles/${id}`),
  createRole: (data) => api.post('/roles', data),
  updateRole: (id, data) => api.patch(`/roles/${id}`, data),
  deleteRole: (id) => api.delete(`/roles/${id}`),
};
