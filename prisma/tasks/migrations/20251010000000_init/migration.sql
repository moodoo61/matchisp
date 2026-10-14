-- CreateTable
CREATE TABLE IF NOT EXISTS "_section_meta" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "_section_meta_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "_section_meta_key_key" ON "_section_meta"("key");

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "taskDate" DATE NOT NULL,
    "type" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "responsibleUserId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tasks_number_key" ON "tasks"("number");
CREATE INDEX "tasks_taskDate_idx" ON "tasks"("taskDate");
CREATE INDEX "tasks_type_idx" ON "tasks"("type");
CREATE INDEX "tasks_responsibleUserId_idx" ON "tasks"("responsibleUserId");
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_createdByUserId_idx" ON "tasks"("createdByUserId");

-- CreateTable
CREATE TABLE "task_assignees" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "task_assignees_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_assignees_taskId_userId_key" ON "task_assignees"("taskId", "userId");
CREATE INDEX "task_assignees_userId_idx" ON "task_assignees"("userId");

ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
