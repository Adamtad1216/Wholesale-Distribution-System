import api from '../../services/api';

export const vehiclesApi = {
  list: (params) => api.get('/vehicles', { params }),
  getById: (id) => api.get(`/vehicles/${id}`),
  getEligibleDrivers: () => api.get('/vehicles/drivers'),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.patch(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
  assignDriver: (id, data) => api.post(`/vehicles/${id}/assign`, data),
  unassignDriver: (id, data) => api.post(`/vehicles/${id}/unassign`, data),
};
