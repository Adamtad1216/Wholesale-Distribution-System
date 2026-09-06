import api from '../../services/api';

export const companiesApi = {
  getCompanies: (params) => api.get('/companies', { params }),
  getCompanyById: (id) => api.get(`/companies/${id}`),
  createCompany: (data) => api.post('/companies', data),
  updateCompany: (id, data) => api.patch(`/companies/${id}`, data),
  deleteCompany: (id) => api.delete(`/companies/${id}`),
  getRegions: (params) => api.get('/regions', { params }),
};
