"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incidentRouter = void 0;
const express_1 = require("express");
const integration_services_1 = require("../services/integration.services");
const api_1 = require("../utils/api");
const authenticate_1 = require("../middlewares/authenticate");
const zod_1 = require("zod");
const validate_1 = require("../middlewares/validate");
const rxjs_1 = require("rxjs");
const router = (0, express_1.Router)();
exports.incidentRouter = router;
router.use(authenticate_1.authenticate);
const incidentFiltersSchema = zod_1.z.object({
    status: zod_1.z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    fromDate: zod_1.z.string().optional(),
    toDate: zod_1.z.string().optional(),
});
const createIncidentSchema = zod_1.z.object({
    title: zod_1.z.string().min(5),
    description: zod_1.z.string().min(10).optional(),
    status: zod_1.z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    alertIds: zod_1.z.array(zod_1.z.string()).optional(),
});
const updateIncidentSchema = createIncidentSchema.partial();
router.get('/', (0, validate_1.validate)(incidentFiltersSchema), async (req, res, next) => {
    try {
        const incidents = await integration_services_1.integrationService.getIncidentsForUser(req?.user?.id, req.query);
        api_1.APIResponse.success(res, incidents);
    }
    catch (error) {
        next(error);
    }
});
router.post('/', (0, validate_1.validate)(createIncidentSchema), async (req, res, next) => {
    try {
        const incident = await prisma?.incident.create({
            data: {
                ...req.body,
                customerId: req.user?.customerId || null,
                alerts: req.body.alertIds ? {
                    connect: req.body.alertIds.map((id) => ({ id })),
                } : undefined,
            },
            include: {
                alerts: true,
            },
        });
        api_1.APIResponse.success(res, incident, 'Incident created');
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const incident = await prisma?.incident.findUnique({
            where: { id: req.params.id },
            include: {
                alerts: {
                    include: {
                        rule: true,
                        events: true,
                    },
                },
                comments: true,
                assignee: true,
                customer: true,
            },
        });
        if (!incident) {
            throw new rxjs_1.NotFoundError('Incident not found');
        }
        api_1.APIResponse.success(res, incident);
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', (0, validate_1.validate)(updateIncidentSchema), async (req, res, next) => {
    try {
        const incident = await prisma?.incident.update({
            where: { id: req.params.id },
            data: req.body,
            include: {
                alerts: true,
            },
        });
        api_1.APIResponse.success(res, incident, 'Incident updated');
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/comments', (0, validate_1.validate)(zod_1.z.object({ content: zod_1.z.string().min(1), isInternal: zod_1.z.boolean().optional() })), async (req, res, next) => {
    try {
        const comment = await prisma?.incidentComment.create({
            data: {
                content: req.body.content,
                isInternal: req.body.isInternal || false,
                incidentId: req.params.id,
                authorId: req.user?.id,
            },
        });
        api_1.APIResponse.success(res, comment, 'Comment added');
    }
    catch (error) {
        next(error);
    }
});
