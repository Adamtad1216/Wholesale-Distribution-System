import api from '../../services/api';

export const personsApi = {
  getPersons: async (params = {}) => {
    const response = await api.get('/persons', { params });
    return response.data;
  },
};
