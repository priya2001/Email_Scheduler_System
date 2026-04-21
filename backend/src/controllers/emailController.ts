import { Request, Response, NextFunction } from 'express';
import { prismaClient } from '../config/database';
import { logger } from '../utils/logger';

// Create a new email
export const createEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, subject, body, scheduledTime, delayBetweenEmails, hourlyLimit } = req.body;

    // Validation
    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject',
      });
    }

    // Get or create sender
    let sender = await prismaClient.sender.findFirst({
      where: { email: from },
    });

    if (!sender) {
      sender = await prismaClient.sender.create({
        data: {
          email: from,
          name: from.split('@')[0],
        },
      });
    }

    // Create email with toEmail field and proper status mapping
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

    // Format response to match frontend expectations
    res.status(201).json({
      success: true,
      data: {
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
        status: 'scheduled',
        from: email.sender.email,
      },
    });
  } catch (error: any) {
    logger.error('Error creating email:', error);
    next(error);
  }
};

// Get all emails for a user
export const getEmails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;

    // Map UI status to Prisma enum
    let prismaStatus: any = undefined;
    if (status === 'scheduled' || status === 'draft') {
      prismaStatus = 'PENDING';
    } else if (status === 'sent') {
      prismaStatus = 'SENT';
    }

    const where = prismaStatus ? { status: prismaStatus } : {};

    const emails = await prismaClient.email.findMany({
      where,
      include: {
        sender: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response
    const formattedEmails = emails.map((email) => ({
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
    }));

    res.status(200).json({
      success: true,
      data: formattedEmails,
    });
  } catch (error: any) {
    logger.error('Error fetching emails:', error);
    next(error);
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
      return res.status(404).json({
        success: false,
        error: 'Email not found',
      });
    }

    res.status(200).json({
      success: true,
      data: email,
    });
  } catch (error: any) {
    logger.error('Error fetching email:', error);
    next(error);
  }
};

// Update email
export const updateEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, scheduledTime, subject, body } = req.body;

    // Map UI status to Prisma enum if provided
    let prismaStatus: any = undefined;
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
    });

    logger.info(`Email updated: ${email.id}`);

    res.status(200).json({
      success: true,
      data: email,
    });
  } catch (error: any) {
    logger.error('Error updating email:', error);
    next(error);
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

    res.status(200).json({
      success: true,
      message: 'Email deleted successfully',
    });
  } catch (error: any) {
    logger.error('Error deleting email:', error);
    next(error);
  }
};
