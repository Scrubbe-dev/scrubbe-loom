import apiClient from '../axios';

export default {
  getAlerts(filters = {}) {
    return apiClient.get('/alerts', { 
      params: filters 
    });
  },

  getAlertDetails(alertId: any) {
    return apiClient.get(`/alerts/${alertId}`);
  },

  updateAlertStatus(alertId: any, status: any) {
    return apiClient.put(`/alerts/${alertId}/status`, { status });
  }
};