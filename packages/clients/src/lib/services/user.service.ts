import apiClient from '../axios';

export default {
  // Get current user profile
  getMe() {
    return apiClient.get('/users/me');
  },

  // Update current user
  updateMe(userData: any) {
    return apiClient.put('/users/me', userData);
  },

  // Change password
  changePassword(currentPassword: any, newPassword: any) {
    return apiClient.post('/users/me/change-password', { 
      currentPassword, 
      newPassword 
    });
  },

  // List all users (admin only)
  getAllUsers() {
    return apiClient.get('/users');
  },

  // Update user (admin only)
  updateUser(userId: any, userData: any) {
    return apiClient.put(`/users/${userId}`, userData);
  }
};