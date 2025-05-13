import { Router } from 'express';
import { reportService } from '../services/report.service';
import { APIResponse } from '../utils/api';
import { authenticate} from '../middlewares/authenticate';
import {authorize } from '../middlewares/authorize'
import { Role } from '@prisma/client';
import { z } from 'zod';
import { validate } from '../middlewares/validate';

const router = Router();

router.use(authenticate);
router.use(authorize([Role.ADMIN]));

const reportConfigSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  recipients: z.array(z.string().email()),
  customerId: z.string().optional(),
  reportTypes: z.array(z.enum(['SUMMARY', 'DETAILED', 'INCIDENTS'])),
});

router.post('/configs', 
  validate(reportConfigSchema),
  async (req, res, next) => {
    try {
      const config = await reportService.createReportConfiguration(
        req.user?.id as string,
        req.body
      );
      APIResponse.success(res, config, 'Report configuration created');
    } catch (error) {
      next(error);
    }
  }
);

router.get('/configs', 
  async (req, res, next) => {
    try {
      const configs = await reportService.getReportConfigurations(req.user?.id as string);
      APIResponse.success(res, configs);
    } catch (error) {
      next(error);
    }
  }
);

router.post('/generate', 
  validate(z.object({
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    reportTypes: z.array(z.enum(['SUMMARY', 'DETAILED', 'INCIDENTS'])),
  })),
  async (req, res, next) => {
    try {
      const report = await reportService.generateReport({
        frequency: 'ON_DEMAND',
        recipients: [],
        reportTypes: req.body.reportTypes,
        // fromDate: req.body.fromDate ,
        // toDate: req.body.toDate,
        userId: req.user?.id as string,
        smtpFrom: undefined,
        smtpUser: undefined,
        id: '',
        customerId: null,
        isActive: false,
        lastRunAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      APIResponse.success(res, report, 'Report generated');
    } catch (error) {
      next(error);
    }
  }
);

export { router as reportRouter };