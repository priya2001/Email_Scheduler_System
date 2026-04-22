import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { EmailStatus, Prisma } from '@prisma/client';
import { environment } from '../config/environment';
import { prismaClient } from '../config/database';
import { logger } from '../utils/logger';
import { enqueueEmailJobAt } from '../queues/emailQueue';

type ApiEmailStatus = 'scheduled' | 'sent' | 'draft';
type EmailWithSender = Prisma.EmailGetPayload<{
  include: { sender: true };
}>;

interface EmailResponse {
  id: string;
  recipient: string;
  subject: string;
  preview: string;
  scheduledTime: string;
  status: ApiEmailStatus;
  from: string;
  batchId?: string | null;
}

function formatEmailResponse(email: {
  id: string;
  toEmail: string;
  subject: string;
  body: string;
  scheduledTime: Date;
  status: EmailStatus;
  sender: { email: string };
  batchId?: string | null;
}): EmailResponse {
  return {
    id: email.id,
    recipient: email.toEmail,
    subject: email.subject,
    preview: email.body ? email.body.substring(0, 100) : '',
    scheduledTime: email.scheduledTime.toLocaleString('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }),
    status: email.status === 'PENDING' ? 'scheduled' : email.status === 'SENT' ? 'sent' : 'draft',
    from: email.sender.email,
    batchId: email.batchId ?? null,
  };
}

async function resolveSender(from: string) {
  return prismaClient.sender.upsert({
    where: { email: from },
    update: {},
    create: {
      email: from,
      name: from.split('@')[0],
    },
  });
}

function parsePositiveInteger(value: unknown, fallback: number): number {
  const parsed = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function computeBulkIntervalMs(delayBetweenEmails?: unknown, hourlyLimit?: unknown): number {
  const userDelayMs = parsePositiveInteger(delayBetweenEmails, 0) * 1000;
  const hourlyLimitValue = parsePositiveInteger(hourlyLimit, environment.maxEmailsPerHour);
  const hourlyDelayMs = hourlyLimitValue > 0 ? Math.ceil(3600000 / hourlyLimitValue) : 0;

  return Math.max(userDelayMs, hourlyDelayMs, environment.minDelayBetweenEmails);
}

// Create a new email
export const createEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, subject, body, scheduledTime } = req.body;

    if (!from || !to || !subject) {
      return void res.status(400).json({
        success: false,
        error: 'Missing required fields: from, to, subject',
      });
    }

    const sender = await resolveSender(from);

    const email = await prismaClient.email.create({
      data: {
        senderId: sender.id,
        toEmail: to,
        subject,
        body: body || '',
        scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(),
        status: 'PENDING',
      },
      include: {
        sender: true,
      },
    });

    logger.info(`Email created: ${email.id}`);

    await enqueueEmailJobAt(email.id, email.scheduledTime);

    logger.info(`Email queued for delivery: ${email.id}`);

    return void res.status(201).json({
      success: true,
      data: formatEmailResponse(email),
    });
  } catch (error: any) {
    logger.error('Error creating email:', error);
    return next(error);
  }
};

// Create emails in bulk
export const createBulkEmails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, recipients, subject, body, scheduledTime, delayBetweenEmails, hourlyLimit } = req.body;

    if (!from || !Array.isArray(recipients) || recipients.length === 0 || !subject) {
      return void res.status(400).json({
        success: false,
        error: 'Missing required fields: from, recipients, subject',
      });
    }

    const normalizedRecipients = Array.from(
      new Set(
        recipients
          .map((recipient: string) => recipient.trim())
          .filter((recipient: string) => recipient.length > 0)
      )
    );

    if (normalizedRecipients.length === 0) {
      return void res.status(400).json({
        success: false,
        error: 'At least one valid recipient is required',
      });
    }

    const sender = await resolveSender(from);
    const batchId = uuidv4();
    const intervalMs = computeBulkIntervalMs(delayBetweenEmails, hourlyLimit);

    const createdEmails = await prismaClient.$transaction(async (tx) => {
      const results: EmailWithSender[] = [];

      const baseScheduledDate = scheduledTime ? new Date(scheduledTime) : new Date();

      for (const [index, recipient] of normalizedRecipients.entries()) {
        const emailScheduledTime = new Date(baseScheduledDate.getTime() + index * intervalMs);

        const email = await tx.email.create({
          data: {
            senderId: sender.id,
            toEmail: recipient,
            subject,
            body: body || '',
            scheduledTime: emailScheduledTime,
            status: 'PENDING',
            batchId,
          },
          include: {
            sender: true,
          },
        });

        results.push(email);
      }

      return results;
    });

    logger.info('Bulk email batch created', {
      batchId,
      totalRequested: recipients.length,
      totalCreated: createdEmails.length,
      intervalMs,
    });

    await Promise.all(
      createdEmails.map((email) => enqueueEmailJobAt(email.id, email.scheduledTime))
    );

    logger.info('Bulk email batch queued for delivery', {
      batchId,
      totalQueued: createdEmails.length,
      intervalMs,
    });

    return void res.status(201).json({
      success: true,
      data: {
        batchId,
        totalRecipients: recipients.length,
        createdCount: createdEmails.length,
        emails: createdEmails.map(formatEmailResponse),
      },
    });
  } catch (error: any) {
    logger.error('Error creating bulk emails:', error);
    return next(error);
  }
};

// Get all emails for a user
export const getEmails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;

    let prismaStatus: EmailStatus | undefined;
    if (status === 'scheduled' || status === 'draft') {
      prismaStatus = 'PENDING';
    } else if (status === 'sent') {
      prismaStatus = 'SENT';
    }

    const where: Prisma.EmailWhereInput = prismaStatus ? { status: prismaStatus } : {};

    const emails = await prismaClient.email.findMany({
      where,
      include: {
        sender: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedEmails = emails.map(formatEmailResponse);

    return void res.status(200).json({
      success: true,
      data: formattedEmails,
    });
  } catch (error: any) {
    logger.error('Error fetching emails:', error);
    return next(error);
  }
};

// Get single email
export const getEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const email = await prismaClient.email.findUnique({
      where: { id },
      include: {
        sender: true,
      },
    });

    if (!email) {
      return void res.status(404).json({
        success: false,
        error: 'Email not found',
      });
    }

    return void res.status(200).json({
      success: true,
      data: formatEmailResponse(email),
    });
  } catch (error: any) {
    logger.error('Error fetching email:', error);
    return next(error);
  }
};

// Update email
export const updateEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, scheduledTime, subject, body } = req.body;

    let prismaStatus: EmailStatus | undefined;
    if (status === 'sent') {
      prismaStatus = 'SENT';
    } else if (status === 'scheduled' || status === 'draft') {
      prismaStatus = 'PENDING';
    }

    const email = await prismaClient.email.update({
      where: { id },
      data: {
        ...(prismaStatus && { status: prismaStatus }),
        ...(scheduledTime && { scheduledTime: new Date(scheduledTime) }),
        ...(subject && { subject }),
        ...(body && { body }),
      },
      include: {
        sender: true,
      },
    });

    logger.info(`Email updated: ${email.id}`);

    return void res.status(200).json({
      success: true,
      data: formatEmailResponse(email),
    });
  } catch (error: any) {
    logger.error('Error updating email:', error);
    return next(error);
  }
};

// Delete email
export const deleteEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prismaClient.email.delete({
      where: { id },
    });

    logger.info(`Email deleted: ${id}`);

    return void res.status(200).json({
      success: true,
      message: 'Email deleted successfully',
    });
  } catch (error: any) {
    logger.error('Error deleting email:', error);
    return next(error);
  }
};
