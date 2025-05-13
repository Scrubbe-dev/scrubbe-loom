"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationPoller = void 0;
const prisma_client_1 = __importDefault(require("../prisma/prisma-client"));
const logger_1 = require("../utils/logger");
const integration_services_1 = require("../services/integration.services");
class IntegrationPoller {
    pollIntervals = new Map();
    retryAttempts = new Map();
    maxRetries = 3;
    retryDelay = 5000; // 5 seconds
    async init() {
        try {
            await this.initializeExistingIntegrations();
            this.setupPrismaHooks();
            logger_1.logger.info('Integration poller initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize integration poller:', error);
            throw error;
        }
    }
    async initializeExistingIntegrations() {
        try {
            const integrations = await prisma_client_1.default?.dataSourceIntegration.findMany({
                where: { isActive: true },
            });
            logger_1.logger.info(`Found ${integrations?.length} active integrations to initialize`);
            const pollingPromises = integrations?.map(integration => this.startPolling(integration));
            await Promise.all(pollingPromises);
        }
        catch (error) {
            logger_1.logger.error('Error initializing existing integrations:', error);
            throw error;
        }
    }
    setupPrismaHooks() {
        prisma_client_1.default?.$use(async (params, next) => {
            const result = await next(params);
            if (params.model === 'DataSourceIntegration') {
                if (params.action === 'create' || params.action === 'update') {
                    await this.handleIntegrationChange(result);
                }
                else if (params.action === 'delete') {
                    this.stopPolling(result.id);
                }
            }
            return result;
        });
    }
    async handleIntegrationChange(integration) {
        try {
            if (integration.isActive) {
                await this.startPolling(integration);
            }
            else {
                this.stopPolling(integration.id);
            }
        }
        catch (error) {
            logger_1.logger.error(`Error handling integration change for ${integration.id}:`, error);
        }
    }
    async startPolling(integration) {
        this.stopPolling(integration.id);
        const poll = async () => {
            try {
                await integration_services_1.integrationService.pollDataSource(integration);
                this.retryAttempts.delete(integration.id); // Reset retry counter on success
            }
            catch (error) {
                await this.handlePollingError(integration, error instanceof Error ? error : new Error(String(error)));
            }
        };
        const interval = setInterval(poll, integration.pollingInterval || 300000 // Default 5 minutes
        );
        this.pollIntervals.set(integration.id, interval);
        logger_1.logger.info(`Started polling for integration ${integration.id}`);
        // Initial immediate poll
        setTimeout(poll, 1000);
    }
    async handlePollingError(integration, error) {
        const attempt = (this.retryAttempts.get(integration.id) || 0) + 1;
        this.retryAttempts.set(integration.id, attempt);
        if (attempt <= this.maxRetries) {
            logger_1.logger.warn(`Retry attempt ${attempt} for integration ${integration.id}`);
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            const interval = this.pollIntervals.get(integration.id);
            if (interval) {
                // Type-safe way to access the underlying function
                const pollFunction = interval._onTimeout;
                if (typeof pollFunction === 'function') {
                    pollFunction();
                }
            }
        }
        else {
            logger_1.logger.error(`Max retries exceeded for integration ${integration.id}. Stopping polling.`);
            this.stopPolling(integration.id);
        }
    }
    stopPolling(integrationId) {
        const interval = this.pollIntervals.get(integrationId);
        if (interval) {
            clearInterval(interval);
            this.pollIntervals.delete(integrationId);
            this.retryAttempts.delete(integrationId);
            logger_1.logger.info(`Stopped polling for integration ${integrationId}`);
        }
    }
    async shutdown() {
        for (const [id, interval] of this.pollIntervals) {
            clearInterval(interval);
            logger_1.logger.info(`Stopped polling for integration ${id}`);
        }
        this.pollIntervals.clear();
        this.retryAttempts.clear();
    }
    getPollingStatus(integrationId) {
        const interval = this.pollIntervals.get(integrationId);
        if (!interval) {
            return { isPolling: false, nextPoll: null };
        }
        // Type-safe way to access the remaining time
        const remainingMs = interval._idleTimeout;
        return {
            isPolling: true,
            nextPoll: new Date(Date.now() + remainingMs)
        };
    }
}
exports.integrationPoller = new IntegrationPoller();
