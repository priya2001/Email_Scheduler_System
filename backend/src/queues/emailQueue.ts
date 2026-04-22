import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis';

export const EMAIL_QUEUE_NAME = 'email-queue';

const connection = createRedisConnection(EMAIL_QUEUE_NAME);

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: true,
    removeOnFail: 100,
  },
});
