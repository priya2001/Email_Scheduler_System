import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  status?: number;
  message: string;
}

class ErrorHandler {
  handle(error: AppError, _req: Request, res: Response, _next: NextFunction): void {
    const status = error.status || 500;
    const message = error.message || 'Internal Server Error';

    logger.error(`Error: ${message}`, error);

    res.status(status).json({
      success: false,
      error: {
        status,
        message,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

export const errorHandler = new ErrorHandler();

// Middleware wrapper for error handling in async routes
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Custom error class
export class CustomError extends Error implements AppError {
  status: number;

  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
    this.name = 'CustomError';
  }
}
