import apiClient from '../axios';

export default {
  // Create report configuration
  createReportConfig(configData: { frequency: any; recipients: any; reportTypes: any; customerId: any; }) {
    return apiClient.post('/reports/configs', {
      frequency: configData.frequency,
      recipients: configData.recipients,
      reportTypes: configData.reportTypes,
      customerId: configData.customerId
    });
  },

  // Get report configurations
  getReportConfigs() {
    return apiClient.get('/reports/configs');
  },

  // Generate report on demand
  generateReport(reportTypes: any, fromDate: any, toDate: any) {
    return apiClient.post('/reports/generate', {
      reportTypes,
      fromDate,
      toDate
    });
  }
};