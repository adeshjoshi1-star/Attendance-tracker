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

export const employeeLogin = async (employeeCode) => {
  const response = await api.post('/auth/employee-login', { employee_code: employeeCode });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data.user;
};
