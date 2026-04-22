import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis';

export const EMAIL_QUEUE_NAME = 'email-queue';

export interface EmailJobData {
  emailId: string;
}

const connection = createRedisConnection(EMAIL_QUEUE_NAME);

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

export async function enqueueEmailJob(emailId: string) {
  return emailQueue.add(
    'send-email',
    { emailId },
    {
      jobId: emailId,
    }
  );
}
