import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createSupabaseRouteClient } from './supabase';
import { environment } from '../config/environment';

export interface IncomingAttachmentDraft {
  filename: string;
  mimeType: string;
  size: number;
  contentBase64: string;
}

export interface StoredAttachmentMetadata {
  filename: string;
  mimeType: string;
  size: number;
  storageBucket: string;
  storagePath: string;
  publicUrl: string;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'file';
}

function buildStoragePath(filename: string) {
  return `attachments/${Date.now()}-${uuidv4()}-${sanitizeFileName(filename)}`;
}

export async function uploadAttachmentsToStorage(
  req: Request,
  res: Response,
  attachments: IncomingAttachmentDraft[],
): Promise<StoredAttachmentMetadata[]> {
  if (!attachments.length) {
    return [];
  }

  const supabase = createSupabaseRouteClient(req, res);
  const storageBucket = environment.supabase.storageBucket || 'email-attachments';

  const uploads = await Promise.all(
    attachments.map(async (attachment) => {
      const storagePath = buildStoragePath(attachment.filename);
      const fileBuffer = Buffer.from(attachment.contentBase64, 'base64');

      const { error: uploadError } = await supabase.storage
        .from(storageBucket)
        .upload(storagePath, fileBuffer, {
          contentType: attachment.mimeType,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data } = supabase.storage.from(storageBucket).getPublicUrl(storagePath);

      return {
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
        storageBucket,
        storagePath,
        publicUrl: data.publicUrl,
      };
    }),
  );

  return uploads;
}

export async function deleteUploadedAttachments(
  req: Request,
  res: Response,
  attachments: StoredAttachmentMetadata[],
): Promise<void> {
  if (!attachments.length) {
    return;
  }

  const supabase = createSupabaseRouteClient(req, res);
  const groupedByBucket = new Map<string, string[]>();

  for (const attachment of attachments) {
    const paths = groupedByBucket.get(attachment.storageBucket) || [];
    paths.push(attachment.storagePath);
    groupedByBucket.set(attachment.storageBucket, paths);
  }

  await Promise.all(
    Array.from(groupedByBucket.entries()).map(async ([bucket, paths]) => {
      await supabase.storage.from(bucket).remove(paths);
    }),
  );
}
