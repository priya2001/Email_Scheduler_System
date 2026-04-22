import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { environment } from '../config/environment';
import { sendEmail } from '../lib/mailer';
import { EMAIL_QUEUE_NAME } from '../queues/emailQueue';
import { logger } from '../utils/logger';
import { emailService } from '../services/emailService';
import { Prisma } from '@prisma/client';
import { MailAttachment } from '../lib/mailer';

export interface EmailJobData {
  emailId: string;
}

type EmailWithAttachments = Prisma.EmailGetPayload<{
  include: { sender: true; attachments: true };
}>;

type AttachmentRecord = {
  filename: string;
  mimeType: string;
  publicUrl: string;
};

async function downloadAttachment(url: string): Promise<Buffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download attachment from ${url}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export function createEmailWorker(): Worker<EmailJobData> {
  const connection = createRedisConnection('email-worker');

  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
      const { emailId } = job.data;

      logger.info('Processing email job', { jobId: job.id, emailId });

      try {
        const email: EmailWithAttachments | null = await emailService.getEmailById(emailId);

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

        const emailAttachments = (email.attachments ?? []) as AttachmentRecord[];

        const attachments: MailAttachment[] = await Promise.all(
          emailAttachments.map(async (attachment: AttachmentRecord) => ({
            filename: attachment.filename,
            contentType: attachment.mimeType,
            content: await downloadAttachment(attachment.publicUrl),
          })),
        );

        await sendEmail(email.toEmail, email.subject, email.body, attachments);
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
