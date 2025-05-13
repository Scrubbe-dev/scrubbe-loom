import { Router } from 'express';
import { authRouter } from './auth.routes';
import { integrationRouter } from './integration.routes';
import { eventRouter } from './event.routes';
import { alertRouter } from './alert.routes';
import { incidentRouter } from './incident.routes';
import { reportRouter } from './report.routes';
import { userRouter } from './user.routes';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { Role } from '@prisma/client';

export const router = Router();

// Public routes
router.use('/auth', authRouter);

// Authenticated routes
router.use('/users', userRouter);

// router.use(authenticate);

// User routes

// Integration routes
router.use('/integrations', integrationRouter);

// Event routes
router.use('/events', eventRouter);

// Alert routes
router.use('/alerts', alertRouter);

// Incident routes
router.use('/incidents', incidentRouter);

// Report routes (admin only)
router.use('/reports', authorize([Role.ADMIN]), reportRouter);