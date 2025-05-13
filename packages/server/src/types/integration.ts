export type DataSourceType = 'CLOUD_STORAGE' | 'AUTH_LOGS' | 'DNS_LOGS' | 'ENDPOINT_LOGS';

export interface DataSourceConfig {
  type: DataSourceType;
  credentials: any;
  pollingInterval?: number;
  customerId?: string;
}

export interface LogEvent {
  timestamp: Date;
  source: string;
  type: string;
  rawData: any;
  severity?: number;
  customerId?: string;
}

export interface DataSourceIntegration {
  id: string;
  type: DataSourceType;
  config: any;
  pollingInterval: number | null;
  isActive: boolean;
  customerId: string | null;
  userId: string;
}