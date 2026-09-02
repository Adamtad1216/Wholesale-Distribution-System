import api from '../../services/api';

export const customersApi = {
  getCustomers: (params) => api.get('/customers', { params }),
  getCustomerById: (id) => api.get(`/customers/${id}`),
  createCustomer: (customerData) => api.post('/customers', customerData),
  updateCustomer: (id, customerData) => api.patch(`/customers/${id}`, customerData),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
};
