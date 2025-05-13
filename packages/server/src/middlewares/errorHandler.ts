import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { APIError } from '../utils/error';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof APIError) {
    logger.error(`API Error: ${err.message}`);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  logger.error(`Unhandled Error: ${err.message}`);
  console.error(err.stack);

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};