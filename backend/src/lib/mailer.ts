import nodemailer from 'nodemailer';
import { htmlToText } from 'html-to-text';
import { environment } from '../config/environment';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: environment.smtp.host,
  port: environment.smtp.port,
  auth: {
    user: environment.smtp.user,
    pass: environment.smtp.password
  }
});

const mailOptions = {
  from: environment.smtp.user,
};

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export async function sendEmail(to: string, subject: string, html: string, attachments: MailAttachment[] = []) {
  const info = await transporter.sendMail({
    ...mailOptions,
    to,
    subject,
    text: htmlToText(html),
    html,
    ...(attachments.length > 0 && { attachments }),
  });

  logger.info('Email sent', {
    to,
    subject,
    messageId: info.messageId,
  });

  return info;
}
