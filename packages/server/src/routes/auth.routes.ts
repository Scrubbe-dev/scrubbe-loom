import { Router } from 'express';
import { AuthService } from '../services/auth.services';
import { APIResponse } from '../utils/api';
import { z } from 'zod';
import { validate } from '../middlewares/validate';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['USER', 'ADMIN', 'CUSTOMER']).optional(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

router.post('/login',
  //  validate(loginSchema),
    async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(email, password)
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (error) {
    // res.json(error).status(500)
    next(error);
  }
});


router.post('/register', 
  // validate(registerSchema),
  async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      const user = await AuthService.register(email, password, firstName, lastName, role);
      APIResponse.success(res, user, 'Registration successful');
    } catch (error) {
      next(error);
    }
  }
);

router.post('/refresh', 
  validate(refreshTokenSchema),
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);
      APIResponse.success(res, result, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }
);

router.post('/request-reset', 
  validate(z.object({ email: z.string().email() })),
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const token = await AuthService.generateResetToken(email, 'RESET_LINK');
      APIResponse.success(res, { token }, 'Reset token generated');
    } catch (error) {
      next(error);
    }
  }
);

router.post('/reset-password', 
  validate(resetPasswordSchema),
  async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      await AuthService.resetPassword(token, newPassword);
      APIResponse.success(res, null, 'Password reset successful');
    } catch (error) {
      next(error);
    }
  }
);

export { router as authRouter };