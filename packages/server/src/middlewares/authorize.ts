import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError } from '../utils/error';

type AuthorizeOptions = {
  roles?: Role[];
  allowSameUser?: boolean;
  paramId?: string;
};

export const authorize = (options: AuthorizeOptions | Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      let roles: Role[] = [];
      let allowSameUser = false;
      let paramId = 'id';

      if (Array.isArray(options)) {
        roles = options;
      } else {
        roles = options.roles || [];
        allowSameUser = options.allowSameUser || false;
        paramId = options.paramId || 'id';
      }

      // Check if user has one of the required roles
      const hasRole = roles.length === 0 || roles.includes(req.user.role as Role);
      
      // Check if user is accessing their own resource
      const isSameUser = allowSameUser && req.params[paramId] === req.user.id;

      if (!hasRole && !isSameUser) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Convenience functions for common roles
export const authorizeAdmin = authorize([Role.ADMIN]);
export const authorizeCustomer = authorize([Role.CUSTOMER]);
export const authorizeUser = authorize([Role.USER]);