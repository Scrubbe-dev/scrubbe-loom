import { integrationService } from '../services/integration.services';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';
import prisma  from '../prisma/prisma-client';

class AlertGenerator {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.setupListeners();
  }

  private setupListeners() {
    integrationService.onEvent('new_event', async (event) => {
      try {
        // Check if event matches any detection rules
        const rules:any = await prisma?.detectionRule.findMany({
          where: {
            isActive: true,
            OR: [
              { platform: 'CUSTOM' },
              { platform: event.source.toUpperCase() },
            ],
          },
        });

        for (const rule of rules) {
          if (this.evaluateRule(rule, event)) {
            await this.generateAlert(rule, event);
          }
        }
      } catch (error) {
        logger.error(`Error processing event for alerts: ${event.id}`, error);
      }
    });
  }

  private evaluateRule(rule: any, event: any): boolean {
    try {
      // Simplified rule evaluation - in production use a proper rule engine
      const condition = JSON.parse(JSON.stringify(rule.condition));
      
      // Check event type match
      if (condition.eventType && condition.eventType !== event.type) {
        return false;
      }
      
      // Check severity threshold
      if (condition.minSeverity && event.severity < condition.minSeverity) {
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error(`Error evaluating rule ${rule.id}:`, error);
      return false;
    }
  }

  private async generateAlert(rule: any, event: any) {
    try {
      const alert = await prisma?.alert.create({
        data: {
          ruleId: rule.id,
          severity: this.convertSeverityToNumber(rule.severity),
          status: 'OPEN',
        },
      });

      await prisma?.securityEvent.update({
        where: { id: event.id },
        data: {
          alertid: alert?.id,
          processed: true,
        },
      });

      if (rule.autoGenerateIncident) {
        this.emitter.emit('new_alert', { alert, event });
      }

      logger.info(`Generated alert ${alert?.id} for rule ${rule.name}`);
    } catch (error) {
      logger.error(`Error generating alert for rule ${rule.id}:`, error);
    }
  }

  private convertSeverityToNumber(severity: string): number {
    switch (severity) {
      case 'CRITICAL': return 4;
      case 'HIGH': return 3;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
      default: return 0;
    }
  }

  onAlert(listener: (alert: any) => void) {
    this.emitter.on('new_alert', listener);
  }
}

export const alertGenerator = new AlertGenerator();