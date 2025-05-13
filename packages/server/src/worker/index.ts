import { eventProcessor } from './event.processor';
import { reportScheduler } from './report.scheduler';
import { alertGenerator } from './alert.generator';
import { incidentManager } from './incident.manager';
import { integrationPoller } from './integration.poller';
import { logger } from '../utils/logger';

class WorkerManager {
  private workers: any[] = [];

  init() {
    try {
      this.workers = [
        eventProcessor,
        reportScheduler,
        alertGenerator,
        incidentManager,
        integrationPoller
      ];

      this.workers.forEach(worker => {
        if (worker.init) worker.init();
      });

      logger.info('All background workers initialized');
    } catch (error) {
      logger.error('Error initializing workers:', error);
      throw error;
    }
  }

  shutdown() {
    this.workers.forEach(worker => {
      if (worker.stop) worker.stop();
    });
    logger.info('All background workers stopped');
  }
}

export const workerManager = new WorkerManager();