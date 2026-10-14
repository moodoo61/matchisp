-- AlterTable tasks: دورة العمل
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "workNotes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "resultNotes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "blockerReason" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3);
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "finishedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "task_attachments" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "uploadedById" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "task_attachments_taskId_createdAt_idx" ON "task_attachments"("taskId", "createdAt");
CREATE INDEX IF NOT EXISTS "task_attachments_uploadedById_idx" ON "task_attachments"("uploadedById");

DO $$ BEGIN
  ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "task_parts_requests" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "requestedById" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_parts_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "task_parts_requests_taskId_createdAt_idx" ON "task_parts_requests"("taskId", "createdAt");
CREATE INDEX IF NOT EXISTS "task_parts_requests_requestedById_idx" ON "task_parts_requests"("requestedById");
CREATE INDEX IF NOT EXISTS "task_parts_requests_status_idx" ON "task_parts_requests"("status");

DO $$ BEGIN
  ALTER TABLE "task_parts_requests" ADD CONSTRAINT "task_parts_requests_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
