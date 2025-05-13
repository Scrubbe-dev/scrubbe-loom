import prisma from '../prisma/prisma-client';
import { logger } from '../utils/logger';
import { integrationService } from '../services/integration.services';
import { DataSourceIntegration } from '../types/integration';
import { Prisma } from '@prisma/client';

class IntegrationPoller {
  private pollIntervals: Map<string, NodeJS.Timeout> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private readonly maxRetries = 3;
  private readonly retryDelay = 5000; // 5 seconds

  async init(): Promise<void> {
    try {
      await this.initializeExistingIntegrations();
      this.setupPrismaHooks();
      logger.info('Integration poller initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize integration poller:', error);
      throw error;
    }
  }

  private async initializeExistingIntegrations(): Promise<void> {
    try {
      const integrations = await prisma?.dataSourceIntegration.findMany({
        where: { isActive: true },
      });

      logger.info(`Found ${integrations?.length} active integrations to initialize`);

      const pollingPromises = integrations?.map(integration => 
        this.startPolling(integration as DataSourceIntegration)
      );
      await Promise.all(pollingPromises as any);
    } catch (error) {
      logger.error('Error initializing existing integrations:', error);
      throw error;
    }
  }

  private setupPrismaHooks(): void {
    prisma?.$use(async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<any>) => {
      const result = await next(params);
      
      if (params.model === 'DataSourceIntegration') {
        if (params.action === 'create' || params.action === 'update') {
          await this.handleIntegrationChange(result);
        } else if (params.action === 'delete') {
          this.stopPolling(result.id);
        }
      }
      
      return result;
    });
  }

  private async handleIntegrationChange(integration: DataSourceIntegration): Promise<void> {
    try {
      if (integration.isActive) {
        await this.startPolling(integration);
      } else {
        this.stopPolling(integration.id);
      }
    } catch (error) {
      logger.error(`Error handling integration change for ${integration.id}:`, error);
    }
  }

  private async startPolling(integration: DataSourceIntegration): Promise<void> {
    this.stopPolling(integration.id);

    const poll = async (): Promise<void> => {
      try {
        await integrationService.pollDataSource(integration);
        this.retryAttempts.delete(integration.id); // Reset retry counter on success
      } catch (error: unknown) {
        await this.handlePollingError(integration, error instanceof Error ? error : new Error(String(error)));
      }
    };

    const interval = setInterval(
      poll, 
      integration.pollingInterval || 300000 // Default 5 minutes
    );

    this.pollIntervals.set(integration.id, interval);
    logger.info(`Started polling for integration ${integration.id}`);

    // Initial immediate poll
    setTimeout(poll, 1000);
  }

  private async handlePollingError(integration: DataSourceIntegration, error: Error): Promise<void> {
    const attempt = (this.retryAttempts.get(integration.id) || 0) + 1;
    this.retryAttempts.set(integration.id, attempt);

    if (attempt <= this.maxRetries) {
      logger.warn(`Retry attempt ${attempt} for integration ${integration.id}`);
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      const interval = this.pollIntervals.get(integration.id);
      if (interval) {
        // Type-safe way to access the underlying function
        const pollFunction = (interval as unknown as { _onTimeout: () => void })._onTimeout;
        if (typeof pollFunction === 'function') {
          pollFunction();
        }
      }
    } else {
      logger.error(`Max retries exceeded for integration ${integration.id}. Stopping polling.`);
      this.stopPolling(integration.id);
    }
  }

  private stopPolling(integrationId: string): void {
    const interval = this.pollIntervals.get(integrationId);
    if (interval) {
      clearInterval(interval);
      this.pollIntervals.delete(integrationId);
      this.retryAttempts.delete(integrationId);
      logger.info(`Stopped polling for integration ${integrationId}`);
    }
  }

  async shutdown(): Promise<void> {
    for (const [id, interval] of this.pollIntervals) {
      clearInterval(interval);
      logger.info(`Stopped polling for integration ${id}`);
    }
    this.pollIntervals.clear();
    this.retryAttempts.clear();
  }

  getPollingStatus(integrationId: string): { isPolling: boolean; nextPoll: Date | null } {
    const interval = this.pollIntervals.get(integrationId);
    if (!interval) {
      return { isPolling: false, nextPoll: null };
    }

    // Type-safe way to access the remaining time
    const remainingMs = (interval as unknown as { _idleTimeout: number })._idleTimeout;
    return {
      isPolling: true,
      nextPoll: new Date(Date.now() + remainingMs)
    };
  }
}

export const integrationPoller = new IntegrationPoller();