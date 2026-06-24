import api from './api';

export const getDailyReport = async (params = {}) => {
  const response = await api.get('/reports/daily', { params });
  return response.data;
};

export const getMonthlyReport = async (params = {}) => {
  const response = await api.get('/reports/monthly', { params });
  return response.data;
};

export const getDepartmentReport = async (params = {}) => {
  const response = await api.get('/reports/department', { params });
  return response.data;
};

export const getExportUrl = (type, format, params = {}) => {
  const query = new URLSearchParams({ format, ...params }).toString();
  return `/api/reports/export/${type}?${query}`;
};
