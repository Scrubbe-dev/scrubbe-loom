"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const auth_routes_1 = require("./auth.routes");
const integration_routes_1 = require("./integration.routes");
const event_routes_1 = require("./event.routes");
const alert_routes_1 = require("./alert.routes");
const incident_routes_1 = require("./incident.routes");
const report_routes_1 = require("./report.routes");
const user_routes_1 = require("./user.routes");
const authorize_1 = require("../middlewares/authorize");
const client_1 = require("@prisma/client");
exports.router = (0, express_1.Router)();
// Public routes
exports.router.use('/auth', auth_routes_1.authRouter);
// Authenticated routes
exports.router.use('/users', user_routes_1.userRouter);
// router.use(authenticate);
// User routes
// Integration routes
exports.router.use('/integrations', integration_routes_1.integrationRouter);
// Event routes
exports.router.use('/events', event_routes_1.eventRouter);
// Alert routes
exports.router.use('/alerts', alert_routes_1.alertRouter);
// Incident routes
exports.router.use('/incidents', incident_routes_1.incidentRouter);
// Report routes (admin only)
exports.router.use('/reports', (0, authorize_1.authorize)([client_1.Role.ADMIN]), report_routes_1.reportRouter);
