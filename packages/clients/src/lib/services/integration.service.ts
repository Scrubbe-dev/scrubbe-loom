import apiClient from '../axios';

export default {
  addIntegration(integrationData: { type: any; credentials: any; pollingInterval: any; customerId: any; }) {
    return apiClient.post('/integrations', {
      type: integrationData.type,
      credentials: integrationData.credentials,
      pollingInterval: integrationData.pollingInterval,
      customerId: integrationData.customerId
    });
  },

  getIntegrations() {
    return apiClient.get('/integrations');
  },

  // Remove integration
  removeIntegration(integrationId: any) {
    return apiClient.delete(`/integrations/${integrationId}`);
  }
};