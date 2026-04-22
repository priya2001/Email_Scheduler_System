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
        emit: 'stdout',
        level: 'error',
      },
      {
        emit: 'stdout',
        level: 'warn',
      },
    ],
    errorFormat: 'pretty',
  });

// Log Prisma client initialization
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
