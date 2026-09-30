-- AlterTable
ALTER TABLE "sstp_settings" ADD COLUMN IF NOT EXISTS "tlsExt" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "sstp_settings" ADD COLUMN IF NOT EXISTS "autoConnect" BOOLEAN NOT NULL DEFAULT true;

UPDATE "sstp_settings"
SET "tlsExt" = true, "autoConnect" = true
WHERE "id" = 'default';
