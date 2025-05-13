"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationRouter = void 0;
const express_1 = require("express");
const integration_services_1 = require("../services/integration.services");
const api_1 = require("../utils/api");
const authenticate_1 = require("../middlewares/authenticate");
const zod_1 = require("zod");
const validate_1 = require("../middlewares/validate");
const router = (0, express_1.Router)();
exports.integrationRouter = router;
const integrationSchema = zod_1.z.object({
    type: zod_1.z.enum(['CLOUD_STORAGE', 'AUTH_LOGS', 'DNS_LOGS', 'ENDPOINT_LOGS']),
    credentials: zod_1.z.object({
        apiKey: zod_1.z.string(),
        secret: zod_1.z.string(),
        region: zod_1.z.string().optional(),
        bucket: zod_1.z.string().optional(),
    }),
    pollingInterval: zod_1.z.number().min(30000).optional(),
    customerId: zod_1.z.string().optional(),
});
router.post('/', authenticate_1.authenticate, (0, validate_1.validate)(integrationSchema), async (req, res, next) => {
    try {
        const integration = await integration_services_1.integrationService.addDataSource(req.user?.id, req.body);
        api_1.APIResponse.success(res, integration, 'Integration added successfully');
    }
    catch (error) {
        next(error);
    }
});
router.get('/', authenticate_1.authenticate, async (req, res, next) => {
    try {
        const integrations = await prisma?.dataSourceIntegration.findMany({
            where: {
                userId: req.user?.id,
                isActive: true,
            },
        });
        api_1.APIResponse.success(res, integrations);
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', authenticate_1.authenticate, async (req, res, next) => {
    try {
        await integration_services_1.integrationService.removeDataSource(req.params.id);
        api_1.APIResponse.success(res, null, 'Integration removed successfully');
    }
    catch (error) {
        next(error);
    }
});
