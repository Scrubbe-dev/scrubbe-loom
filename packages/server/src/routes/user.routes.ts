import { Router } from 'express';
import { APIResponse } from '../utils/api';
import { authenticate } from '../middlewares/authenticate';
import {authorize} from '../middlewares/authorize'
import { Role } from '@prisma/client';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { AuthService } from '../services/auth.services';

const router = Router();

router.use(authenticate);

const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  isActive: z.boolean().optional(),
  role: z.enum(['USER', 'ADMIN', 'CUSTOMER']).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

router.get('/me', 
  async (req, res, next) => {
    try {
      const user = await prisma?.user.findUnique({
        where: { id: req.user?.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLogin: true,
          Customer: { select: { id: true, name: true } },
        },
      });
      
      APIResponse.success(res, user);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/me', 
  validate(updateUserSchema),
  async (req, res, next) => {
    try {
      const user = await prisma?.user.update({
        where: { id: req.user?.id },
        data: req.body,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });
      
      APIResponse.success(res, user, 'Profile updated');
    } catch (error) {
      next(error);
    }
  }
);

router.post('/me/change-password', 
  validate(changePasswordSchema),
  async (req, res, next) => {
    try {
      await AuthService?.changePassword(
        req.user?.id as string,
        req.body.currentPassword,
        req.body.newPassword
      );
      APIResponse.success(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
);

router.get('/', 
  authorize([Role.ADMIN]),
  async (req, res, next) => {
    try {
      const users = await prisma?.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLogin: true,
          Customer: { select: { id: true, name: true } },
        },
      });
      
      APIResponse.success(res, users);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', 
  authorize([Role.ADMIN]),
  validate(updateUserSchema),
  async (req, res, next) => {
    try {
      const user = await prisma?.user.update({
        where: { id: req.params.id },
        data: req.body,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      });
      
      APIResponse.success(res, user, 'User updated');
    } catch (error) {
      next(error);
    }
  }
);

export { router as userRouter };