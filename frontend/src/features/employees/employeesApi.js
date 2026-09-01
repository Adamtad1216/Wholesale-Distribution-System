import api from '../../services/api';

export const employeesApi = {
  getEmployees: (params) => api.get('/employees', { params }),
  getEmployeeById: (id) => api.get(`/employees/${id}`),
  createEmployee: (data) => api.post('/employees', data),
  updateEmployee: (id, data) => api.patch(`/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/employees/${id}`),
};
