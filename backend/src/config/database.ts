import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClient =
  global.prisma ||
  new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'stdout',
        level: 'info',
      },
      {
        emit: 'stdout',
        level: 'warn',
      },
      {
        emit: 'stdout',
        level: 'error',
      },
    ],
  });

// Log Prisma queries in development
// Note: Query logging is disabled due to strict TypeScript typing
// You can enable it by using prisma.$extends if needed
if (process.env.NODE_ENV !== 'production') {
  logger.debug('Prisma client initialized in development mode');
}

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prismaClient;
}

export { prismaClient };

/**
 * Disconnect Prisma client gracefully
 */
export async function disconnectPrisma(): Promise<void> {
  await prismaClient.$disconnect();
  logger.info('Prisma client disconnected');
}
