import apiClient from '../axios';

export default {
  // List incidents with filters
  getIncidents(filters = {}) {
    return apiClient.get('/incidents', { 
      params: filters 
    });
  },

  // Create new incident
  createIncident(incidentData: { title: any; description: any; status: any; priority: any; alertIds: any; }) {
    return apiClient.post('/incidents', {
      title: incidentData.title,
      description: incidentData.description,
      status: incidentData.status || 'OPEN',
      priority: incidentData.priority || 'MEDIUM',
      alertIds: incidentData.alertIds || []
    });
  },

  // Get incident details
  getIncidentDetails(incidentId: any) {
    return apiClient.get(`/incidents/${incidentId}`);
  },

  // Update incident
  updateIncident(incidentId: any, updateData: any) {
    return apiClient.put(`/incidents/${incidentId}`, updateData);
  },

  // Add comment to incident
  addIncidentComment(incidentId: any, content: any, isInternal = false) {
    return apiClient.post(`/incidents/${incidentId}/comments`, {
      content,
      isInternal
    });
  }
};