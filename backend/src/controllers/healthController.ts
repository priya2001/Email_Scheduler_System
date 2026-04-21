import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export class HealthController {
  health(_req: Request, res: Response): void {
    logger.debug('Health check endpoint accessed');

    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  }

  readiness(_req: Request, res: Response): void {
    // In production, you would check database and Redis connectivity here
    res.status(200).json({
      success: true,
      message: 'Server is ready to accept requests',
      timestamp: new Date().toISOString(),
    });
  }
}

export const healthController = new HealthController();
