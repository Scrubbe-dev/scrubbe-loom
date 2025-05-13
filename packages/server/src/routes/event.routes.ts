import { Router } from 'express';
import { integrationService } from '../services/integration.services';
import { APIResponse } from '../utils/api';
import { authenticate } from '../middlewares/authenticate';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { NotFoundError } from 'rxjs';

const router = Router();

router.use(authenticate);

const eventFiltersSchema = z.object({
  source: z.string().optional(),
  type: z.string().optional(),
  severity: z.number().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

router.get('/', 
  validate(eventFiltersSchema),
  async (req, res, next) => {
    try {
      const events = await integrationService.getEventsForUser(req?.user?.id as string, req.query);
      APIResponse.success(res, events);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id', 
  async (req, res, next) => {
    try {
      const event = await prisma?.securityEvent.findUnique({
        where: { id: req.params.id },
      });
      
      if (!event) {
        throw new NotFoundError('Event not found');
      }
      
      APIResponse.success(res, event);
    } catch (error) {
      next(error);
    }
  }
);

export { router as eventRouter };