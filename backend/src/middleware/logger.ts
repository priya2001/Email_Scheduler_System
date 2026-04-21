import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const { method, url, ip } = req;

  logger.info(`Incoming Request: ${method} ${url}`, { ip });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    logger.info(`Request Completed: ${method} ${url}`, {
      statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};
