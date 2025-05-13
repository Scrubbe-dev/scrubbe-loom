"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workerManager = void 0;
const event_processor_1 = require("./event.processor");
const report_scheduler_1 = require("./report.scheduler");
const alert_generator_1 = require("./alert.generator");
const incident_manager_1 = require("./incident.manager");
const integration_poller_1 = require("./integration.poller");
const logger_1 = require("../utils/logger");
class WorkerManager {
    workers = [];
    init() {
        try {
            this.workers = [
                event_processor_1.eventProcessor,
                report_scheduler_1.reportScheduler,
                alert_generator_1.alertGenerator,
                incident_manager_1.incidentManager,
                integration_poller_1.integrationPoller
            ];
            this.workers.forEach(worker => {
                if (worker.init)
                    worker.init();
            });
            logger_1.logger.info('All background workers initialized');
        }
        catch (error) {
            logger_1.logger.error('Error initializing workers:', error);
            throw error;
        }
    }
    shutdown() {
        this.workers.forEach(worker => {
            if (worker.stop)
                worker.stop();
        });
        logger_1.logger.info('All background workers stopped');
    }
}
exports.workerManager = new WorkerManager();
