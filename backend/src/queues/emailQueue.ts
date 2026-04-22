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

export async function enqueueEmailJobAt(emailId: string, scheduledTime?: string | Date | null) {
  const scheduledDate = scheduledTime ? new Date(scheduledTime) : new Date();
  const delay = Math.max(scheduledDate.getTime() - Date.now(), 0);

  return emailQueue.add(
    'send-email',
    { emailId },
    {
      jobId: emailId,
      delay,
    }
  );
}
