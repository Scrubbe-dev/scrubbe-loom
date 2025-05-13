"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertRouter = void 0;
const express_1 = require("express");
const integration_services_1 = require("../services/integration.services");
const api_1 = require("../utils/api");
const authenticate_1 = require("../middlewares/authenticate");
const zod_1 = require("zod");
const validate_1 = require("../middlewares/validate");
const rxjs_1 = require("rxjs");
const router = (0, express_1.Router)();
exports.alertRouter = router;
router.use(authenticate_1.authenticate);
const alertFiltersSchema = zod_1.z.object({
    status: zod_1.z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'SUPPRESSED']).optional(),
    severity: zod_1.z.number().optional(),
    fromDate: zod_1.z.string().optional(),
    toDate: zod_1.z.string().optional(),
});
router.get('/', (0, validate_1.validate)(alertFiltersSchema), async (req, res, next) => {
    try {
        const alerts = await integration_services_1.integrationService.getAlertsForUser(req?.user?.id, req.query);
        api_1.APIResponse.success(res, alerts);
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const alert = await prisma?.alert.findUnique({
            where: { id: req.params.id },
            include: {
                rule: true,
                events: true,
                incidents: true,
            },
        });
        if (!alert) {
            throw new rxjs_1.NotFoundError('Alert not found');
        }
        api_1.APIResponse.success(res, alert);
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id/status', (0, validate_1.validate)(zod_1.z.object({ status: zod_1.z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'SUPPRESSED']) })), async (req, res, next) => {
    try {
        const alert = await prisma?.alert.update({
            where: { id: req.params.id },
            data: { status: req.body.status },
        });
        api_1.APIResponse.success(res, alert, 'Alert status updated');
    }
    catch (error) {
        next(error);
    }
});
