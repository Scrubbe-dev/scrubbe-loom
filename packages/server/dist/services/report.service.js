"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = exports.ReportService = void 0;
const date_fns_1 = require("date-fns");
const nodemailer_1 = require("nodemailer");
const logger_1 = require("../utils/logger");
const config_1 = require("../config/config");
const prisma_client_1 = __importDefault(require("../prisma/prisma-client"));
class ReportService {
    transporter = (0, nodemailer_1.createTransport)({
        host: config_1.config.smtpHost,
        port: config_1.config.smtpPort,
        secure: config_1.config.smtpSecure,
        auth: {
            user: config_1.config.smtpUser,
            pass: config_1.config.smtpPass,
        },
    });
    async generateAndSendReports() {
        try {
            const reportConfigs = await prisma_client_1.default.reportConfiguration.findMany({
                where: { isActive: true },
                include: { user: true },
            });
            for (const config of reportConfigs) {
                try {
                    const shouldRun = this.shouldGenerateReport(config);
                    if (shouldRun) {
                        await this.generateReport(config);
                    }
                }
                catch (error) {
                    logger_1.logger.error(`Error generating report for config ${config.id}:`, error);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error in report generation job:', error);
        }
    }
    shouldGenerateReport(config) {
        const now = new Date();
        switch (config.frequency) {
            case 'DAILY':
                // Run once per day (check if last run was more than 24 hours ago)
                return !config.lastRunAt ||
                    config.lastRunAt < (0, date_fns_1.subDays)(now, 1);
            case 'WEEKLY':
                // Run on Mondays and if last run was more than a week ago
                return (now.getDay() === 1) &&
                    (!config.lastRunAt || config.lastRunAt < (0, date_fns_1.subDays)(now, 7));
            case 'MONTHLY':
                // Run on first day of month and if last run was more than a month ago
                return (now.getDate() === 1) &&
                    (!config.lastRunAt || config.lastRunAt < (0, date_fns_1.subDays)(now, 30));
            default:
                return false;
        }
    }
    async generateReport(config) {
        const now = new Date();
        let startDate;
        switch (config.frequency) {
            case 'DAILY':
                startDate = (0, date_fns_1.subDays)(now, 1);
                break;
            case 'WEEKLY':
                startDate = (0, date_fns_1.subDays)(now, 7);
                break;
            case 'MONTHLY':
                startDate = (0, date_fns_1.subDays)(now, 30);
                break;
            default:
                startDate = (0, date_fns_1.subDays)(now, 1);
        }
        try {
            const reportData = await this.getReportData(config, startDate, now);
            const htmlContent = this.generateHtmlReport(config, reportData, startDate, now);
            await this.sendEmailReport(config, htmlContent);
            await prisma_client_1.default.reportConfiguration.update({
                where: { id: config.id },
                data: { lastRunAt: now },
            });
            logger_1.logger.info(`Successfully sent report to ${config.recipients.join(', ')}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to generate report for config ${config.id}:`, error);
            throw error;
        }
    }
    async getReportData(config, startDate, endDate) {
        const where = {
            timestamp: {
                gte: startDate,
                lte: endDate,
            },
        };
        if (config.customerId) {
            where.customerId = config.customerId;
        }
        const [events, alerts, incidents] = await Promise.all([
            prisma_client_1.default.securityEvent.findMany({
                where,
                orderBy: { timestamp: 'desc' },
            }),
            prisma_client_1.default.alert.findMany({
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
            prisma_client_1.default.incident.findMany({
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
    generateHtmlReport(config, data, startDate, endDate) {
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
        <p>Report period: ${(0, date_fns_1.format)(startDate, 'PPpp')} to ${(0, date_fns_1.format)(endDate, 'PPpp')}</p>
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
    generateSummarySection(data) {
        const criticalAlerts = data.alerts.filter((a) => a.severity >= 4).length;
        const highAlerts = data.alerts.filter((a) => a.severity === 3).length;
        const openIncidents = data.incidents.filter((i) => i.status === 'OPEN').length;
        const resolvedIncidents = data.incidents.filter((i) => i.status === 'RESOLVED').length;
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
    generateDetailedEventsSection(events) {
        const eventsByType = events.reduce((acc, event) => {
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
          <td>${lastEvent ? (0, date_fns_1.format)(lastEvent.timestamp, 'PPpp') : 'N/A'}</td>
        </tr>
      `;
        }
        eventsTable += `
        </tbody>
      </table>
    `;
        return eventsTable;
    }
    generateIncidentsSection(incidents) {
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
          <td>${(0, date_fns_1.format)(incident.createdAt, 'PPpp')}</td>
        </tr>
      `;
        }
        incidentsTable += `
        </tbody>
      </table>
    `;
        return incidentsTable;
    }
    async sendEmailReport(config, htmlContent) {
        await this.transporter.sendMail({
            from: `"SOAR Platform" <${config.smtpFrom || config.smtpUser}>`,
            to: config.recipients.join(', '),
            subject: `SOAR Security Report - ${(0, date_fns_1.format)(new Date(), 'MMMM d, yyyy')}`,
            html: htmlContent,
        });
    }
    async createReportConfiguration(userId, config) {
        return prisma_client_1.default.reportConfiguration.create({
            data: {
                ...config,
                userId,
                isActive: true,
            },
        });
    }
    async getReportConfigurations(userId) {
        return prisma_client_1.default.reportConfiguration.findMany({
            where: { userId },
        });
    }
    async updateReportConfiguration(id, config) {
        return prisma_client_1.default.reportConfiguration.update({
            where: { id },
            data: config,
        });
    }
    async deleteReportConfiguration(id) {
        return prisma_client_1.default.reportConfiguration.delete({
            where: { id },
        });
    }
}
exports.ReportService = ReportService;
exports.reportService = new ReportService();
