import api from '../../services/api';

export const documentsApi = {
  uploadFile: (file, folder = 'wholesale_docs') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    return api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  createDocument: (docData) => api.post('/documents', docData),
  getDocumentTypes: () => api.get('/documents/types'),
  createDocumentType: (typeData) => api.post('/documents/types', typeData),
  updateDocumentStatus: (id, status) => api.patch(`/documents/${id}/status`, { status }),
};
