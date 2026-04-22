import { createEmailWorker } from './workers/emailWorker';
import { disconnectPrisma } from './config/database';
import { logger } from './utils/logger';

const worker = createEmailWorker();

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} signal received: closing BullMQ worker`);

  await worker.close();
  await disconnectPrisma();

  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection in worker:', reason);
  process.exit(1);
});

logger.info('BullMQ worker started', {
  queue: 'email-queue',
});
