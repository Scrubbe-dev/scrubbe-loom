export interface DataSourceIntegration {
    id: string
    type: 'CLOUD_STORAGE' | 'AUTH_LOGS' | 'DNS_LOGS' | 'ENDPOINT_LOGS'
    config: Record<string, any>
    status: 'active' | 'inactive' | 'error'
    lastSynced: Date
    errorCount: number
  }

