import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma  from '../prisma/prisma-client';
import { config } from '../config/config';
import { APIError, UnauthorizedError } from '../utils/error';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: string;
        customerId?: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token missing');
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    
    // Find user in database
    const user = await prisma?.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        Customer: { select: { id: true } },
      },
    });

    // Check if user exists and is active
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      role: user.role,
      customerId: user.Customer?.[0]?.id,
    };

    // Update last login time
    await prisma?.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
};