import { integrationService } from '../services/integration.services';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

class EventProcessor {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.setupListeners();
  }

  private setupListeners() {
    integrationService.onEvent('new_event', (event) => {
      this.processEvent(event);
    });
  }

  async processEvent(event: any) {
    try {
      logger.info(`Processing event: ${event.type} from ${event.source}`);
      
      // Add your event processing logic here
      // Example: Enrichment, correlation, etc.
      
      logger.info(`Event processed: ${event.id}`);
    } catch (error) {
      logger.error(`Error processing event ${event.id}:`, error);
    }
  }
}

export const eventProcessor = new EventProcessor();