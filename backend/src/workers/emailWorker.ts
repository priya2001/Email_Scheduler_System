import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { environment } from '../config/environment';
import { sendEmail } from '../lib/mailer';
import { EMAIL_QUEUE_NAME } from '../queues/emailQueue';
import { logger } from '../utils/logger';
import { emailService } from '../services/emailService';
import { Email } from '@prisma/client';

export interface EmailJobData {
  emailId: string;
}

export function createEmailWorker(): Worker<EmailJobData> {
  const connection = createRedisConnection('email-worker');

  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
      const { emailId } = job.data;

      logger.info('Processing email job', { jobId: job.id, emailId });

      try {
        const email: Email | null = await emailService.getEmailById(emailId);

        if (!email) {
          throw new Error(`Email not found: ${emailId}`);
        }

        if (email.status !== 'PENDING') {
          logger.info('Skipping email job because it is no longer pending', {
            emailId,
            status: email.status,
          });

          return { skipped: true };
        }

        await sendEmail(email.toEmail, email.subject, email.body);
        await emailService.markAsSent(email.id);

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown email delivery error';

        try {
          await emailService.markAsFailed(emailId, errorMessage);
        } catch (markError) {
          logger.error('Failed to mark email as failed', {
            emailId,
            error: markError instanceof Error ? markError.message : markError,
          });
        }

        throw error;
      }
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
