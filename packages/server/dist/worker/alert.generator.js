"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertGenerator = void 0;
const integration_services_1 = require("../services/integration.services");
const logger_1 = require("../utils/logger");
const events_1 = require("events");
const prisma_client_1 = __importDefault(require("../prisma/prisma-client"));
class AlertGenerator {
    emitter;
    constructor() {
        this.emitter = new events_1.EventEmitter();
        this.setupListeners();
    }
    setupListeners() {
        integration_services_1.integrationService.onEvent('new_event', async (event) => {
            try {
                // Check if event matches any detection rules
                const rules = await prisma_client_1.default?.detectionRule.findMany({
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
            }
            catch (error) {
                logger_1.logger.error(`Error processing event for alerts: ${event.id}`, error);
            }
        });
    }
    evaluateRule(rule, event) {
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
        }
        catch (error) {
            logger_1.logger.error(`Error evaluating rule ${rule.id}:`, error);
            return false;
        }
    }
    async generateAlert(rule, event) {
        try {
            const alert = await prisma_client_1.default?.alert.create({
                data: {
                    ruleId: rule.id,
                    severity: this.convertSeverityToNumber(rule.severity),
                    status: 'OPEN',
                },
            });
            await prisma_client_1.default?.securityEvent.update({
                where: { id: event.id },
                data: {
                    alertid: alert?.id,
                    processed: true,
                },
            });
            if (rule.autoGenerateIncident) {
                this.emitter.emit('new_alert', { alert, event });
            }
            logger_1.logger.info(`Generated alert ${alert?.id} for rule ${rule.name}`);
        }
        catch (error) {
            logger_1.logger.error(`Error generating alert for rule ${rule.id}:`, error);
        }
    }
    convertSeverityToNumber(severity) {
        switch (severity) {
            case 'CRITICAL': return 4;
            case 'HIGH': return 3;
            case 'MEDIUM': return 2;
            case 'LOW': return 1;
            default: return 0;
        }
    }
    onAlert(listener) {
        this.emitter.on('new_alert', listener);
    }
}
exports.alertGenerator = new AlertGenerator();
