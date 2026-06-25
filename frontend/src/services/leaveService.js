import api from './api';

export const applyLeave = async (data) => {
  const response = await api.post('/leaves/apply', data);
  return response.data;
};

export const getMyLeaves = async (params = {}) => {
  const response = await api.get('/leaves/my', { params });
  return response.data;
};

export const getMyLeaveBalance = async () => {
  const response = await api.get('/leaves/my-balance');
  return response.data;
};

export const getPendingLeaves = async () => {
  const response = await api.get('/leaves/pending');
  return response.data;
};

export const getAllLeaves = async (params = {}) => {
  const response = await api.get('/leaves', { params });
  return response.data;
};

export const approveLeave = async (id) => {
  const response = await api.patch(`/leaves/${id}/approve`);
  return response.data;
};

export const rejectLeave = async (id, reason) => {
  const response = await api.patch(`/leaves/${id}/reject`, { reason });
  return response.data;
};

export const adjustLeaveBalance = async (data) => {
  const response = await api.post('/leaves/adjust-balance', data);
  return response.data;
};

export const getLeaveAdjustmentLogs = async (params = {}) => {
  const response = await api.get('/leaves/adjustment-logs', { params });
  return response.data;
};
