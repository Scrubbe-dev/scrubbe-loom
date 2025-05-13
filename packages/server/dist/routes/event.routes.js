"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventRouter = void 0;
const express_1 = require("express");
const integration_services_1 = require("../services/integration.services");
const api_1 = require("../utils/api");
const authenticate_1 = require("../middlewares/authenticate");
const zod_1 = require("zod");
const validate_1 = require("../middlewares/validate");
const rxjs_1 = require("rxjs");
const router = (0, express_1.Router)();
exports.eventRouter = router;
router.use(authenticate_1.authenticate);
const eventFiltersSchema = zod_1.z.object({
    source: zod_1.z.string().optional(),
    type: zod_1.z.string().optional(),
    severity: zod_1.z.number().optional(),
    fromDate: zod_1.z.string().optional(),
    toDate: zod_1.z.string().optional(),
});
router.get('/', (0, validate_1.validate)(eventFiltersSchema), async (req, res, next) => {
    try {
        const events = await integration_services_1.integrationService.getEventsForUser(req?.user?.id, req.query);
        api_1.APIResponse.success(res, events);
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const event = await prisma?.securityEvent.findUnique({
            where: { id: req.params.id },
        });
        if (!event) {
            throw new rxjs_1.NotFoundError('Event not found');
        }
        api_1.APIResponse.success(res, event);
    }
    catch (error) {
        next(error);
    }
});
