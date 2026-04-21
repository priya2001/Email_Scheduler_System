import { Sender } from '@prisma/client';
import { prismaClient } from '../config/database';
import { logger } from '../utils/logger';

export interface CreateSenderInput {
  email: string;
  name: string;
}

/**
 * Sender Service - Handles all sender database operations
 */
export class SenderService {
  /**
   * Create a new sender
   */
  async createSender(data: CreateSenderInput): Promise<Sender> {
    logger.debug('SenderService.createSender called', { email: data.email });

    try {
      const sender = await prismaClient.sender.create({
        data: {
          email: data.email,
          name: data.name,
        },
      });

      logger.info(`Sender created successfully`, { senderId: sender.id });
      return sender;
    } catch (error) {
      logger.error('Failed to create sender', error);
      throw error;
    }
  }

  /**
   * Get sender by ID
   */
  async getSenderById(id: string): Promise<Sender | null> {
    logger.debug('SenderService.getSenderById called', { id });

    try {
      const sender = await prismaClient.sender.findUnique({
        where: { id },
      });

      return sender;
    } catch (error) {
      logger.error('Failed to get sender by ID', error);
      throw error;
    }
  }

  /**
   * Get sender by email
   */
  async getSenderByEmail(email: string): Promise<Sender | null> {
    logger.debug('SenderService.getSenderByEmail called', { email });

    try {
      const sender = await prismaClient.sender.findUnique({
        where: { email },
      });

      return sender;
    } catch (error) {
      logger.error('Failed to get sender by email', error);
      throw error;
    }
  }

  /**
   * Get all senders
   */
  async getAllSenders(): Promise<Sender[]> {
    logger.debug('SenderService.getAllSenders called');

    try {
      const senders = await prismaClient.sender.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return senders;
    } catch (error) {
      logger.error('Failed to get all senders', error);
      throw error;
    }
  }

  /**
   * Update sender
   */
  async updateSender(
    id: string,
    data: Partial<CreateSenderInput>,
  ): Promise<Sender> {
    logger.debug('SenderService.updateSender called', { id });

    try {
      const sender = await prismaClient.sender.update({
        where: { id },
        data,
      });

      logger.info(`Sender updated successfully`, { senderId: id });
      return sender;
    } catch (error) {
      logger.error('Failed to update sender', error);
      throw error;
    }
  }

  /**
   * Delete sender
   */
  async deleteSender(id: string): Promise<Sender> {
    logger.debug('SenderService.deleteSender called', { id });

    try {
      const sender = await prismaClient.sender.delete({
        where: { id },
      });

      logger.info(`Sender deleted successfully`, { senderId: id });
      return sender;
    } catch (error) {
      logger.error('Failed to delete sender', error);
      throw error;
    }
  }
}

export const senderService = new SenderService();
