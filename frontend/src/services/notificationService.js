import api from './api';

export const getNotifications = async (params = {}) => {
  const response = await api.get('/notifications', { params });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

export const getAttendanceReminders = async () => {
  const response = await api.get('/notifications/attendance-reminders');
  return response.data;
};

export const getLeaveNotifications = async () => {
  const response = await api.get('/notifications/leave-notifications');
  return response.data;
};

export const getWfhAlerts = async () => {
  const response = await api.get('/notifications/wfh-alerts');
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};
