"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportScheduler = void 0;
const report_service_1 = require("../services/report.service");
const logger_1 = require("../utils/logger");
const node_schedule_1 = require("node-schedule");
class ReportScheduler {
    dailyJob;
    weeklyJob;
    monthlyJob;
    init() {
        // Daily at 8 AM
        this.dailyJob = (0, node_schedule_1.scheduleJob)('0 8 * * *', () => {
            logger_1.logger.info('Running daily report generation');
            report_service_1.reportService.generateAndSendReports();
        });
        // Weekly on Monday at 8 AM
        this.weeklyJob = (0, node_schedule_1.scheduleJob)('0 8 * * 1', () => {
            logger_1.logger.info('Running weekly report generation');
            report_service_1.reportService.generateAndSendReports();
        });
        // Monthly on 1st at 8 AM
        this.monthlyJob = (0, node_schedule_1.scheduleJob)('0 8 1 * *', () => {
            logger_1.logger.info('Running monthly report generation');
            report_service_1.reportService.generateAndSendReports();
        });
        logger_1.logger.info('Report scheduler initialized');
    }
    stop() {
        if (this.dailyJob)
            this.dailyJob.cancel();
        if (this.weeklyJob)
            this.weeklyJob.cancel();
        if (this.monthlyJob)
            this.monthlyJob.cancel();
    }
}
exports.reportScheduler = new ReportScheduler();
