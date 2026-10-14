-- CreateTable
CREATE TABLE "task_replies" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_replies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "task_replies_taskId_createdAt_idx" ON "task_replies"("taskId", "createdAt");
CREATE INDEX "task_replies_authorId_idx" ON "task_replies"("authorId");

ALTER TABLE "task_replies" ADD CONSTRAINT "task_replies_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
