-- Add batch tracking to emails
ALTER TABLE "emails"
ADD COLUMN IF NOT EXISTS "batchId" TEXT;

CREATE INDEX IF NOT EXISTS "emails_batchId_idx"
ON "emails"("batchId");
