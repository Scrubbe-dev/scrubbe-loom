import { Router } from 'express';
import { integrationService } from '../services/integration.services';
import { APIResponse } from '../utils/api';
import { authenticate } from '../middlewares/authenticate';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { NotFoundError } from 'rxjs';

const router = Router();

router.use(authenticate);

const incidentFiltersSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

const createIncidentSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  alertIds: z.array(z.string()).optional(),
});

const updateIncidentSchema = createIncidentSchema.partial();

router.get('/', 
  validate(incidentFiltersSchema),
  async (req, res, next) => {
    try {
      const incidents = await integrationService.getIncidentsForUser(req?.user?.id as string, req.query);
      APIResponse.success(res, incidents);
    } catch (error) {
      next(error);
    }
  }
);

router.post('/', 
  validate(createIncidentSchema),
  async (req, res, next) => {
    try {
      const incident = await prisma?.incident.create({
        data: {
          ...req.body,
          customerId: req.user?.customerId || null,
          alerts: req.body.alertIds ? {
            connect: req.body.alertIds.map((id: any) => ({ id })),
          } : undefined,
        },
        include: {
          alerts: true,
        },
      });
      
      APIResponse.success(res, incident, 'Incident created');
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id', 
  async (req, res, next) => {
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
        throw new NotFoundError('Incident not found');
      }
      
      APIResponse.success(res, incident);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', 
  validate(updateIncidentSchema),
  async (req, res, next) => {
    try {
      const incident = await prisma?.incident.update({
        where: { id: req.params.id },
        data: req.body,
        include: {
          alerts: true,
        },
      });
      
      APIResponse.success(res, incident, 'Incident updated');
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:id/comments', 
  validate(z.object({ content: z.string().min(1), isInternal: z.boolean().optional() })),
  async (req, res, next) => {
    try {
      const comment = await prisma?.incidentComment.create({
        data: {
          content: req.body.content,
          isInternal: req.body.isInternal || false,
          incidentId: req.params.id,
          authorId: req.user?.id as string,
        },
      });
      
      APIResponse.success(res, comment, 'Comment added');
    } catch (error) {
      next(error);
    }
  }
);

export { router as incidentRouter };