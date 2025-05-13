import apiClient from '../axios/index';

export default {
  // Login
  login(email: any, password: any) {
    return apiClient.post('/auth/login', { email, password });
  },

  // Register
  register(userData: { email: any; password: any; firstName: any; lastName: any; role: any; }) {
    return apiClient.post('/auth/register', {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || 'USER'
    });
  },

  refreshToken(refreshToken: any) {
    return apiClient.post('/auth/refresh-token', { refreshToken });
  },

  forgotPassword(email: any) {
    return apiClient.post('/auth/forgot-password', { email });
  },


  resetPassword(token: any, newPassword: any) {
    return apiClient.post('/auth/reset-password', { token, newPassword });
  }
};