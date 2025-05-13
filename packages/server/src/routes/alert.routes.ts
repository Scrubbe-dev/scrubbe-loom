import { Router } from 'express';
import { integrationService } from '../services/integration.services';
import { APIResponse } from '../utils/api';
import { authenticate } from '../middlewares/authenticate';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { NotFoundError } from 'rxjs';

const router = Router();

router.use(authenticate);

const alertFiltersSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'SUPPRESSED']).optional(),
  severity: z.number().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

router.get('/', 
  validate(alertFiltersSchema),
  async (req, res, next) => {
    try {
      const alerts = await integrationService.getAlertsForUser(req?.user?.id as string, req.query);
      APIResponse.success(res, alerts);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id', 
  async (req, res, next) => {
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
        throw new NotFoundError('Alert not found');
      }
      
      APIResponse.success(res, alert);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id/status', 
  validate(z.object({ status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'SUPPRESSED']) })),
  async (req, res, next) => {
    try {
      const alert = await prisma?.alert.update({
        where: { id: req.params.id },
        data: { status: req.body.status },
      });
      
      APIResponse.success(res, alert, 'Alert status updated');
    } catch (error) {
      next(error);
    }
  }
);

export { router as alertRouter };