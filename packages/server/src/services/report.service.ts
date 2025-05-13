import { format, subDays } from 'date-fns';
import { createTransport } from 'nodemailer';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import { APIError } from '../utils/error';
import { ReportConfig } from '../types/report.types';
import prisma from '../prisma/prisma-client';

export class ReportService {
  private transporter = createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });

  async generateAndSendReports() {
    try {
      const reportConfigs = await prisma.reportConfiguration.findMany({
        where: { isActive: true },
        include: { user: true },
      });

      for (const config of reportConfigs) {
        try {
          const shouldRun = this.shouldGenerateReport(config as any);
          if (shouldRun) {
            await this.generateReport(config as any);
          }
        } catch (error) {
          logger.error(`Error generating report for config ${config.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in report generation job:', error);
    }
  }

  private shouldGenerateReport(config: ReportConfig): boolean {
    const now = new Date();
    
    switch (config.frequency) {
      case 'DAILY':
        // Run once per day (check if last run was more than 24 hours ago)
        return !config.lastRunAt || 
               config.lastRunAt < subDays(now, 1);
      
      case 'WEEKLY':
        // Run on Mondays and if last run was more than a week ago
        return (now.getDay() === 1) && 
               (!config.lastRunAt || config.lastRunAt < subDays(now, 7));
      
      case 'MONTHLY':
        // Run on first day of month and if last run was more than a month ago
        return (now.getDate() === 1) && 
               (!config.lastRunAt || config.lastRunAt < subDays(now, 30));
      
      default:
        return false;
    }
  }

  async generateReport(config: ReportConfig) {
    const now = new Date();
    let startDate: Date;

    switch (config.frequency) {
      case 'DAILY':
        startDate = subDays(now, 1);
        break;
      case 'WEEKLY':
        startDate = subDays(now, 7);
        break;
      case 'MONTHLY':
        startDate = subDays(now, 30);
        break;
      default:
        startDate = subDays(now, 1);
    }

    try {
      const reportData = await this.getReportData(config, startDate, now);
      const htmlContent = this.generateHtmlReport(config, reportData, startDate, now);

      await this.sendEmailReport(config, htmlContent);
      
      await prisma.reportConfiguration.update({
        where: { id: config.id },
        data: { lastRunAt: now },
      });

      logger.info(`Successfully sent report to ${config.recipients.join(', ')}`);
    } catch (error) {
      logger.error(`Failed to generate report for config ${config.id}:`, error);
      throw error;
    }
  }

  private async getReportData(config: ReportConfig, startDate: Date, endDate: Date) {
    const where: any = {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (config.customerId) {
      where.customerId = config.customerId;
    }

    const [events, alerts, incidents] = await Promise.all([
      prisma.securityEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.alert.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          ...(config.customerId && {
            incidents: {
              some: {
                customerId: config.customerId,
              },
            },
          }),
        },
        include: {
          rule: true,
          incidents: true,
        },
      }),
      prisma.incident.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          ...(config.customerId && { customerId: config.customerId }),
        },
        include: {
          alerts: {
            include: {
              rule: true,
            },
          },
        },
      }),
    ]);

    return { events, alerts, incidents };
  }

  private generateHtmlReport(
    config: ReportConfig,
    data: any,
    startDate: Date,
    endDate: Date
  ): string {
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          h1 { color: #2c3e50; }
          h2 { color: #3498db; border-bottom: 1px solid #eee; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
          .summary-card { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .metric { display: inline-block; margin-right: 20px; }
          .metric-value { font-size: 24px; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>SOAR Platform Security Report</h1>
        <p>Report period: ${format(startDate, 'PPpp')} to ${format(endDate, 'PPpp')}</p>
    `;

    if (config.reportTypes.includes('SUMMARY')) {
      htmlContent += this.generateSummarySection(data);
    }

    if (config.reportTypes.includes('DETAILED')) {
      htmlContent += this.generateDetailedEventsSection(data.events);
    }

    if (config.reportTypes.includes('INCIDENTS')) {
      htmlContent += this.generateIncidentsSection(data.incidents);
    }

    htmlContent += `
        <footer style="margin-top: 30px; color: #7f8c8d; font-size: 12px;">
          <p>This report was automatically generated by the SOAR Platform.</p>
        </footer>
      </body>
      </html>
    `;

    return htmlContent;
  }

  private generateSummarySection(data: any): string {
    const criticalAlerts = data.alerts.filter((a: any) => a.severity >= 4).length;
    const highAlerts = data.alerts.filter((a: any) => a.severity === 3).length;
    const openIncidents = data.incidents.filter((i: any) => i.status === 'OPEN').length;
    const resolvedIncidents = data.incidents.filter((i: any) => i.status === 'RESOLVED').length;

    return `
      <div class="summary-card">
        <h2>Executive Summary</h2>
        <div class="metric">
          <div>Total Events</div>
          <div class="metric-value">${data.events.length}</div>
        </div>
        <div class="metric">
          <div>Critical Alerts</div>
          <div class="metric-value" style="color: #e74c3c;">${criticalAlerts}</div>
        </div>
        <div class="metric">
          <div>High Alerts</div>
          <div class="metric-value" style="color: #f39c12;">${highAlerts}</div>
        </div>
        <div class="metric">
          <div>Open Incidents</div>
          <div class="metric-value">${openIncidents}</div>
        </div>
        <div class="metric">
          <div>Resolved Incidents</div>
          <div class="metric-value" style="color: #2ecc71;">${resolvedIncidents}</div>
        </div>
      </div>
    `;
  }

  private generateDetailedEventsSection(events: any[]): string {
    const eventsByType = events.reduce((acc: Record<string, number>, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});

    let eventsTable = `
      <h2>Event Details</h2>
      <table>
        <thead>
          <tr>
            <th>Event Type</th>
            <th>Count</th>
            <th>Last Occurrence</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const [type, count] of Object.entries(eventsByType)) {
      const lastEvent = events.find(e => e.type === type);
      eventsTable += `
        <tr>
          <td>${type}</td>
          <td>${count}</td>
          <td>${lastEvent ? format(lastEvent.timestamp, 'PPpp') : 'N/A'}</td>
        </tr>
      `;
    }

    eventsTable += `
        </tbody>
      </table>
    `;

    return eventsTable;
  }

  private generateIncidentsSection(incidents: any[]): string {
    if (incidents.length === 0) {
      return `<h2>Incidents</h2><p>No incidents in this period.</p>`;
    }

    let incidentsTable = `
      <h2>Incident Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Alerts</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const incident of incidents) {
      incidentsTable += `
        <tr>
          <td>${incident.title}</td>
          <td>${incident.status}</td>
          <td>${incident.priority}</td>
          <td>${incident.alerts.length}</td>
          <td>${format(incident.createdAt, 'PPpp')}</td>
        </tr>
      `;
    }

    incidentsTable += `
        </tbody>
      </table>
    `;

    return incidentsTable;
  }

  private async sendEmailReport(config: ReportConfig, htmlContent: string) {
    await this.transporter.sendMail({
      from: `"SOAR Platform" <${config.smtpFrom || config.smtpUser}>`,
      to: config.recipients.join(', '),
      subject: `SOAR Security Report - ${format(new Date(), 'MMMM d, yyyy')}`,
      html: htmlContent,
    });
  }

  async createReportConfiguration(
    userId: string,
    config: Omit<ReportConfig, 'id' | 'userId' | 'isActive'>
  ) {
    return prisma.reportConfiguration.create({
      data: {
        ...config,
        userId,
        isActive: true,
      },
    });
  }

  async getReportConfigurations(userId: string) {
    return prisma.reportConfiguration.findMany({
      where: { userId },
    });
  }

  async updateReportConfiguration(
    id: string,
    config: Partial<Omit<ReportConfig, 'id' | 'userId'>>
  ) {
    return prisma.reportConfiguration.update({
      where: { id },
      data: config,
    });
  }

  async deleteReportConfiguration(id: string) {
    return prisma.reportConfiguration.delete({
      where: { id },
    });
  }
}

export const reportService = new ReportService();