import api from '../../services/api';

export const jobSpecificationsApi = {
  getJobSpecifications: (params) => api.get('/job-specifications', { params }),
  getJobSpecificationById: (id) => api.get(`/job-specifications/${id}`),
  createJobSpecification: (data) => api.post('/job-specifications', data),
  updateJobSpecification: (id, data) => api.patch(`/job-specifications/${id}`, data),
  deleteJobSpecification: (id) => api.delete(`/job-specifications/${id}`),
};

export default jobSpecificationsApi;
