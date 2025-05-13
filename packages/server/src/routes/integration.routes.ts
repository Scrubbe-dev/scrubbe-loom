import { Router } from 'express';
import { integrationService } from '../services/integration.services';
import { APIResponse } from '../utils/api';
import { authenticate } from '../middlewares/authenticate';
import { z } from 'zod';
import { validate } from '../middlewares/validate';

const router = Router();

const integrationSchema = z.object({
  type: z.enum(['CLOUD_STORAGE', 'AUTH_LOGS', 'DNS_LOGS', 'ENDPOINT_LOGS']),
  credentials: z.object({
    apiKey: z.string(),
    secret: z.string(),
    region: z.string().optional(),
    bucket: z.string().optional(),
  }),
  pollingInterval: z.number().min(30000).optional(),
  customerId: z.string().optional(),
});

router.post('/', 
  authenticate,
  validate(integrationSchema),
  async (req, res, next) => {
    try {
      const integration = await integrationService.addDataSource(
        req.user?.id as string,
        req.body
      );
      APIResponse.success(res, integration, 'Integration added successfully');
    } catch (error) {
      next(error);
    }
  }
);

router.get('/', 
  authenticate,
  async (req, res, next) => {
    try {
      const integrations = await prisma?.dataSourceIntegration.findMany({
        where: { 
          userId: req.user?.id as string,
          isActive: true,
        },
      });
      APIResponse.success(res, integrations);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id',
  authenticate,
  async (req, res, next) => {
    try {
      await integrationService.removeDataSource(req.params.id);
      APIResponse.success(res, null, 'Integration removed successfully');
    } catch (error) {
      next(error);
    }
  }
);

export { router as integrationRouter };