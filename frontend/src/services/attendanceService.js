import api from './api';

export const markAttendance = async (status, remarks, date) => {
  const response = await api.post('/attendance/mark', { attendance_status: status, remarks, attendance_date: date });
  return response.data;
};

export const getMyAttendance = async (params = {}) => {
  const response = await api.get('/attendance/my', { params });
  return response.data;
};

export const getTodayStatus = async () => {
  const response = await api.get('/attendance/today');
  return response.data;
};

export const getMonthlyStats = async () => {
  const response = await api.get('/attendance/monthly-stats');
  return response.data;
};

export const getAllAttendance = async (params = {}) => {
  const response = await api.get('/attendance', { params });
  return response.data;
};

export const getAttendanceById = async (id) => {
  const response = await api.get(`/attendance/${id}`);
  return response.data;
};

export const updateAttendance = async (id, data) => {
  const response = await api.put(`/attendance/${id}`, data);
  return response.data;
};

export const getPendingAttendance = async () => {
  const response = await api.get('/attendance/pending');
  return response.data;
};
