import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;
};

export const changePassword = async (oldPassword, newPassword) => {
  const response = await api.put('/auth/change-password', { oldPassword, newPassword });
  return response.data;
};
