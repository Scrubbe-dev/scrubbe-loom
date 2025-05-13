import { ReportConfiguration } from '@prisma/client';

export interface ReportConfig extends ReportConfiguration {
  smtpFrom: any;
  smtpUser: any;
  recipients: string[];
  reportTypes: ReportType[];
}

export type ReportType = 'SUMMARY' | 'DETAILED' | 'INCIDENTS';

export interface ReportData {
  events: any[];
  alerts: any[];
  incidents: any[];
}