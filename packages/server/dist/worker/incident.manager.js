"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.incidentManager = void 0;
const alert_generator_1 = require("./alert.generator");
const logger_1 = require("../utils/logger");
const prisma_client_1 = __importDefault(require("../prisma/prisma-client"));
class IncidentManager {
    constructor() {
        this.setupListeners();
    }
    setupListeners() {
        alert_generator_1.alertGenerator.onAlert(async ({ alert, event }) => {
            try {
                const incident = await prisma_client_1.default?.incident.create({
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
                logger_1.logger.info(`Created incident ${incident?.id} for alert ${alert.id}`);
            }
            catch (error) {
                logger_1.logger.error(`Error creating incident for alert ${alert.id}:`, error);
            }
        });
    }
    convertSeverityToPriority(severity) {
        switch (severity) {
            case 4: return 'CRITICAL';
            case 3: return 'HIGH';
            case 2: return 'MEDIUM';
            default: return 'LOW';
        }
    }
}
exports.incidentManager = new IncidentManager();
