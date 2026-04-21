import { Email, EmailStatus } from '@prisma/client';
import { prismaClient } from '../config/database';
import { logger } from '../utils/logger';

export interface CreateEmailInput {
  toEmail: string;
  subject: string;
  body: string;
  scheduledTime: Date;
  senderId: string;
}

export interface UpdateEmailInput {
  status?: EmailStatus;
  sentAt?: Date;
  errorMessage?: string;
}

/**
 * Email Service - Handles all email database operations
 * Implements CRUD operations and queries for the Email model
 */
export class EmailService {
  /**
   * Create a new scheduled email
   */
  async createEmail(data: CreateEmailInput): Promise<Email> {
    logger.debug('EmailService.createEmail called', { toEmail: data.toEmail });

    try {
      const email = await prismaClient.email.create({
        data: {
          toEmail: data.toEmail,
          subject: data.subject,
          body: data.body,
          scheduledTime: data.scheduledTime,
          senderId: data.senderId,
          status: 'PENDING',
        },
      });

      logger.info(`Email created successfully`, { emailId: email.id });
      return email;
    } catch (error) {
      logger.error('Failed to create email', error);
      throw error;
    }
  }

  /**
   * Create multiple emails in bulk
   */
  async createEmailsBulk(emails: CreateEmailInput[]): Promise<Email[]> {
    logger.debug('EmailService.createEmailsBulk called', { count: emails.length });

    try {
      const result = await prismaClient.email.createMany({
        data: emails.map((email) => ({
          toEmail: email.toEmail,
          subject: email.subject,
          body: email.body,
          scheduledTime: email.scheduledTime,
          senderId: email.senderId,
          status: 'PENDING',
        })),
      });

      logger.info(`${result.count} emails created in bulk`);
      return emails as Email[]; // Type conversion for return
    } catch (error) {
      logger.error('Failed to create emails in bulk', error);
      throw error;
    }
  }

  /**
   * Get email by ID
   */
  async getEmailById(id: string): Promise<Email | null> {
    logger.debug('EmailService.getEmailById called', { id });

    try {
      const email = await prismaClient.email.findUnique({
        where: { id },
        include: { sender: true },
      });

      return email;
    } catch (error) {
      logger.error('Failed to get email by ID', error);
      throw error;
    }
  }

  /**
   * Get all scheduled emails (pending)
   */
  async getScheduledEmails(limit: number = 50): Promise<Email[]> {
    logger.debug('EmailService.getScheduledEmails called', { limit });

    try {
      const emails = await prismaClient.email.findMany({
        where: {
          status: 'PENDING',
          scheduledTime: {
            lte: new Date(), // Get emails scheduled before now
          },
        },
        include: { sender: true },
        orderBy: { scheduledTime: 'asc' },
        take: limit,
      });

      return emails;
    } catch (error) {
      logger.error('Failed to get scheduled emails', error);
      throw error;
    }
  }

  /**
   * Get pending emails by sender
   */
  async getPendingEmailsBySender(
    senderId: string,
    limit: number = 50,
  ): Promise<Email[]> {
    logger.debug('EmailService.getPendingEmailsBySender called', {
      senderId,
      limit,
    });

    try {
      const emails = await prismaClient.email.findMany({
        where: {
          senderId,
          status: 'PENDING',
        },
        orderBy: { scheduledTime: 'asc' },
        take: limit,
      });

      return emails;
    } catch (error) {
      logger.error('Failed to get pending emails by sender', error);
      throw error;
    }
  }

  /**
   * Get all sent emails
   */
  async getSentEmails(limit: number = 50, offset: number = 0): Promise<Email[]> {
    logger.debug('EmailService.getSentEmails called', { limit, offset });

    try {
      const emails = await prismaClient.email.findMany({
        where: { status: 'SENT' },
        include: { sender: true },
        orderBy: { sentAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return emails;
    } catch (error) {
      logger.error('Failed to get sent emails', error);
      throw error;
    }
  }

  /**
   * Get sent emails count
   */
  async getSentEmailsCount(): Promise<number> {
    logger.debug('EmailService.getSentEmailsCount called');

    try {
      const count = await prismaClient.email.count({
        where: { status: 'SENT' },
      });

      return count;
    } catch (error) {
      logger.error('Failed to get sent emails count', error);
      throw error;
    }
  }

  /**
   * Get failed emails
   */
  async getFailedEmails(limit: number = 50): Promise<Email[]> {
    logger.debug('EmailService.getFailedEmails called', { limit });

    try {
      const emails = await prismaClient.email.findMany({
        where: { status: 'FAILED' },
        include: { sender: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return emails;
    } catch (error) {
      logger.error('Failed to get failed emails', error);
      throw error;
    }
  }

  /**
   * Update email status and details
   */
  async updateEmail(id: string, data: UpdateEmailInput): Promise<Email> {
    logger.debug('EmailService.updateEmail called', { id, status: data.status });

    try {
      const email = await prismaClient.email.update({
        where: { id },
        data: {
          status: data.status,
          sentAt: data.sentAt,
          errorMessage: data.errorMessage,
        },
      });

      logger.info(`Email updated successfully`, { emailId: id, status: data.status });
      return email;
    } catch (error) {
      logger.error('Failed to update email', error);
      throw error;
    }
  }

  /**
   * Mark email as sent
   */
  async markAsSent(id: string): Promise<Email> {
    logger.debug('EmailService.markAsSent called', { id });

    return this.updateEmail(id, {
      status: 'SENT',
      sentAt: new Date(),
    });
  }

  /**
   * Mark email as failed
   */
  async markAsFailed(id: string, errorMessage?: string): Promise<Email> {
    logger.debug('EmailService.markAsFailed called', { id, errorMessage });

    return this.updateEmail(id, {
      status: 'FAILED',
      errorMessage,
    });
  }

  /**
   * Delete email by ID
   */
  async deleteEmail(id: string): Promise<Email> {
    logger.debug('EmailService.deleteEmail called', { id });

    try {
      const email = await prismaClient.email.delete({
        where: { id },
      });

      logger.info(`Email deleted successfully`, { emailId: id });
      return email;
    } catch (error) {
      logger.error('Failed to delete email', error);
      throw error;
    }
  }

  /**
   * Delete multiple emails
   */
  async deleteEmails(ids: string[]): Promise<number> {
    logger.debug('EmailService.deleteEmails called', { count: ids.length });

    try {
      const result = await prismaClient.email.deleteMany({
        where: { id: { in: ids } },
      });

      logger.info(`${result.count} emails deleted`);
      return result.count;
    } catch (error) {
      logger.error('Failed to delete emails', error);
      throw error;
    }
  }

  /**
   * Get emails scheduled in a time range
   */
  async getEmailsInTimeRange(startTime: Date, endTime: Date): Promise<Email[]> {
    logger.debug('EmailService.getEmailsInTimeRange called', {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    });

    try {
      const emails = await prismaClient.email.findMany({
        where: {
          scheduledTime: {
            gte: startTime,
            lte: endTime,
          },
        },
        include: { sender: true },
        orderBy: { scheduledTime: 'asc' },
      });

      return emails;
    } catch (error) {
      logger.error('Failed to get emails in time range', error);
      throw error;
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats(): Promise<{
    total: number;
    pending: number;
    sent: number;
    failed: number;
  }> {
    logger.debug('EmailService.getEmailStats called');

    try {
      const [total, pending, sent, failed] = await Promise.all([
        prismaClient.email.count(),
        prismaClient.email.count({ where: { status: 'PENDING' } }),
        prismaClient.email.count({ where: { status: 'SENT' } }),
        prismaClient.email.count({ where: { status: 'FAILED' } }),
      ]);

      return { total, pending, sent, failed };
    } catch (error) {
      logger.error('Failed to get email stats', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
