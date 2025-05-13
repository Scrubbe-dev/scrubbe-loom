"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRouter = void 0;
const express_1 = require("express");
const report_service_1 = require("../services/report.service");
const api_1 = require("../utils/api");
const authenticate_1 = require("../middlewares/authenticate");
const authorize_1 = require("../middlewares/authorize");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const validate_1 = require("../middlewares/validate");
const router = (0, express_1.Router)();
exports.reportRouter = router;
router.use(authenticate_1.authenticate);
router.use((0, authorize_1.authorize)([client_1.Role.ADMIN]));
const reportConfigSchema = zod_1.z.object({
    frequency: zod_1.z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
    recipients: zod_1.z.array(zod_1.z.string().email()),
    customerId: zod_1.z.string().optional(),
    reportTypes: zod_1.z.array(zod_1.z.enum(['SUMMARY', 'DETAILED', 'INCIDENTS'])),
});
router.post('/configs', (0, validate_1.validate)(reportConfigSchema), async (req, res, next) => {
    try {
        const config = await report_service_1.reportService.createReportConfiguration(req.user?.id, req.body);
        api_1.APIResponse.success(res, config, 'Report configuration created');
    }
    catch (error) {
        next(error);
    }
});
router.get('/configs', async (req, res, next) => {
    try {
        const configs = await report_service_1.reportService.getReportConfigurations(req.user?.id);
        api_1.APIResponse.success(res, configs);
    }
    catch (error) {
        next(error);
    }
});
router.post('/generate', (0, validate_1.validate)(zod_1.z.object({
    fromDate: zod_1.z.string().optional(),
    toDate: zod_1.z.string().optional(),
    reportTypes: zod_1.z.array(zod_1.z.enum(['SUMMARY', 'DETAILED', 'INCIDENTS'])),
})), async (req, res, next) => {
    try {
        const report = await report_service_1.reportService.generateReport({
            frequency: 'ON_DEMAND',
            recipients: [],
            reportTypes: req.body.reportTypes,
            // fromDate: req.body.fromDate ,
            // toDate: req.body.toDate,
            userId: req.user?.id,
            smtpFrom: undefined,
            smtpUser: undefined,
            id: '',
            customerId: null,
            isActive: false,
            lastRunAt: null,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        api_1.APIResponse.success(res, report, 'Report generated');
    }
    catch (error) {
        next(error);
    }
});
