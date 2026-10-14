-- AlterTable
ALTER TABLE "task_types" ADD COLUMN IF NOT EXISTS "allowPartsRequest" BOOLEAN NOT NULL DEFAULT false;
