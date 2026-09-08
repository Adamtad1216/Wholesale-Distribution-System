import api from '../../services/api';

export const notificationsApi = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  getNotificationById: (id) => api.get(`/notifications/${id}`),
  markAsRead: (id, isRead = true) => api.patch(`/notifications/${id}/read`, { isRead }),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

export default notificationsApi;
