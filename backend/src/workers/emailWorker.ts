import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { environment } from '../config/environment';
import { sendEmail } from '../lib/mailer';
import { EMAIL_QUEUE_NAME } from '../queues/emailQueue';
import { logger } from '../utils/logger';

export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
}

export function createEmailWorker(): Worker<EmailJobData> {
  const connection = createRedisConnection('email-worker');

  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
      const { to, subject, body } = job.data;

      logger.info('Processing email job', {
        jobId: job.id,
        to,
        subject,
      });

      await sendEmail(to, subject, body);

      return { success: true };
    },
    {
      connection,
      concurrency: environment.workerConcurrency,
    }
  );

  worker.on('completed', (job) => {
    logger.info('Email job completed', { jobId: job?.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('Email job failed', {
      jobId: job?.id,
      error: err instanceof Error ? err.message : err,
    });
  });

  return worker;
}
