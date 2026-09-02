import api from '../../services/api';

export const permissionsApi = {
  getPermissions: (params) => api.get('/permissions', { params }),
  assignPermissionToRole: (roleId, permissionId) =>
    api.post(`/roles/${roleId}/permissions`, { permissionId }),
  removePermissionFromRole: (roleId, permissionId) =>
    api.delete(`/roles/${roleId}/permissions/${permissionId}`),
};
