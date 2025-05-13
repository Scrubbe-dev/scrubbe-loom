"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventProcessor = void 0;
const integration_services_1 = require("../services/integration.services");
const logger_1 = require("../utils/logger");
const events_1 = require("events");
class EventProcessor {
    emitter;
    constructor() {
        this.emitter = new events_1.EventEmitter();
        this.setupListeners();
    }
    setupListeners() {
        integration_services_1.integrationService.onEvent('new_event', (event) => {
            this.processEvent(event);
        });
    }
    async processEvent(event) {
        try {
            logger_1.logger.info(`Processing event: ${event.type} from ${event.source}`);
            // Add your event processing logic here
            // Example: Enrichment, correlation, etc.
            logger_1.logger.info(`Event processed: ${event.id}`);
        }
        catch (error) {
            logger_1.logger.error(`Error processing event ${event.id}:`, error);
        }
    }
}
exports.eventProcessor = new EventProcessor();
