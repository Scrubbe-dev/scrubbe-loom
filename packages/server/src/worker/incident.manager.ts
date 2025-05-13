import { alertGenerator } from './alert.generator';
import { logger } from '../utils/logger';
import  prisma  from '../prisma/prisma-client';

class IncidentManager {
  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    alertGenerator.onAlert(async ({ alert, event }) => {
      try {
        const incident = await prisma?.incident.create({
          data: {
            title: `New Incident from ${alert.rule.name}`,
            description: `Automatically generated incident from alert ${alert.id}`,
            status: 'OPEN',
            priority: this.convertSeverityToPriority(alert.severity),
            alerts: {
              connect: { id: alert.id },
            },
            customerId: event.customerId || null,
          },
          include: {
            alerts: true,
          },
        });

        logger.info(`Created incident ${incident?.id} for alert ${alert.id}`);
      } catch (error) {
        logger.error(`Error creating incident for alert ${alert.id}:`, error);
      }
    });
  }

  private convertSeverityToPriority(severity: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (severity) {
      case 4: return 'CRITICAL';
      case 3: return 'HIGH';
      case 2: return 'MEDIUM';
      default: return 'LOW';
    }
  }
}

export const incidentManager = new IncidentManager();