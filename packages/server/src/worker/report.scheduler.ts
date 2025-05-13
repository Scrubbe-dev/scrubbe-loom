import { reportService } from '../services/report.service';
import { logger } from '../utils/logger';
import { scheduleJob } from 'node-schedule';

class ReportScheduler {
  private dailyJob: any;
  private weeklyJob: any;
  private monthlyJob: any;

  init() {
    // Daily at 8 AM
    this.dailyJob = scheduleJob('0 8 * * *', () => {
      logger.info('Running daily report generation');
      reportService.generateAndSendReports();
    });

    // Weekly on Monday at 8 AM
    this.weeklyJob = scheduleJob('0 8 * * 1', () => {
      logger.info('Running weekly report generation');
      reportService.generateAndSendReports();
    });

    // Monthly on 1st at 8 AM
    this.monthlyJob = scheduleJob('0 8 1 * *', () => {
      logger.info('Running monthly report generation');
      reportService.generateAndSendReports();
    });

    logger.info('Report scheduler initialized');
  }

  stop() {
    if (this.dailyJob) this.dailyJob.cancel();
    if (this.weeklyJob) this.weeklyJob.cancel();
    if (this.monthlyJob) this.monthlyJob.cancel();
  }
}

export const reportScheduler = new ReportScheduler();