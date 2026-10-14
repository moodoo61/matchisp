-- إعادة هيكلة المهام: أنواع قابلة للإدارة + حقول ديناميكية + أهمية
DROP TABLE IF EXISTS "task_assignees";
DROP TABLE IF EXISTS "task_field_values";
DROP TABLE IF EXISTS "tasks";
DROP TABLE IF EXISTS "task_type_fields";
DROP TABLE IF EXISTS "task_types";

-- CreateTable
CREATE TABLE "task_types" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_types_name_key" ON "task_types"("name");
CREATE INDEX "task_types_sortOrder_idx" ON "task_types"("sortOrder");

-- CreateTable
CREATE TABLE "task_type_fields" (
    "id" UUID NOT NULL,
    "taskTypeId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_type_fields_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "task_type_fields_taskTypeId_sortOrder_idx" ON "task_type_fields"("taskTypeId", "sortOrder");

ALTER TABLE "task_type_fields" ADD CONSTRAINT "task_type_fields_taskTypeId_fkey" FOREIGN KEY ("taskTypeId") REFERENCES "task_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "taskDate" DATE NOT NULL,
    "taskTypeId" UUID NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "details" TEXT NOT NULL DEFAULT '',
    "responsibleUserId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tasks_number_key" ON "tasks"("number");
CREATE INDEX "tasks_taskDate_idx" ON "tasks"("taskDate");
CREATE INDEX "tasks_taskTypeId_idx" ON "tasks"("taskTypeId");
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");
CREATE INDEX "tasks_responsibleUserId_idx" ON "tasks"("responsibleUserId");
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_createdByUserId_idx" ON "tasks"("createdByUserId");

ALTER TABLE "tasks" ADD CONSTRAINT "tasks_taskTypeId_fkey" FOREIGN KEY ("taskTypeId") REFERENCES "task_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "task_field_values" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "fieldId" UUID NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "task_field_values_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_field_values_taskId_fieldId_key" ON "task_field_values"("taskId", "fieldId");
CREATE INDEX "task_field_values_fieldId_idx" ON "task_field_values"("fieldId");

ALTER TABLE "task_field_values" ADD CONSTRAINT "task_field_values_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_field_values" ADD CONSTRAINT "task_field_values_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "task_type_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
