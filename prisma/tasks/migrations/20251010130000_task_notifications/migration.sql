-- CreateTable
CREATE TABLE "task_notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "taskId" UUID,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "task_notifications_userId_createdAt_idx" ON "task_notifications"("userId", "createdAt");
CREATE INDEX "task_notifications_userId_readAt_idx" ON "task_notifications"("userId", "readAt");
CREATE INDEX "task_notifications_taskId_idx" ON "task_notifications"("taskId");

ALTER TABLE "task_notifications" ADD CONSTRAINT "task_notifications_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
