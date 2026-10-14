-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "externalRef" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "workType" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'p3',
    "assetId" UUID,
    "locationText" TEXT NOT NULL DEFAULT '',
    "reporterUserId" UUID NOT NULL,
    "triageNotes" TEXT NOT NULL DEFAULT '',
    "rejectReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'p3',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "requestId" UUID,
    "assetId" UUID,
    "locationText" TEXT NOT NULL DEFAULT '',
    "assigneeUserId" UUID,
    "createdByUserId" UUID NOT NULL,
    "respondBy" TIMESTAMP(3),
    "resolveBy" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "fieldFinishedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "completionNotes" TEXT NOT NULL DEFAULT '',
    "rootCause" TEXT NOT NULL DEFAULT '',
    "cancelReason" TEXT,
    "reworkReason" TEXT,
    "assignmentRejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_events" (
    "id" UUID NOT NULL,
    "workOrderId" UUID NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "actorId" UUID NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assets_kind_idx" ON "assets"("kind");
CREATE INDEX "assets_label_idx" ON "assets"("label");

CREATE UNIQUE INDEX "service_requests_number_key" ON "service_requests"("number");
CREATE INDEX "service_requests_status_idx" ON "service_requests"("status");
CREATE INDEX "service_requests_workType_idx" ON "service_requests"("workType");
CREATE INDEX "service_requests_priority_idx" ON "service_requests"("priority");
CREATE INDEX "service_requests_reporterUserId_idx" ON "service_requests"("reporterUserId");
CREATE INDEX "service_requests_assetId_idx" ON "service_requests"("assetId");

CREATE UNIQUE INDEX "work_orders_number_key" ON "work_orders"("number");
CREATE INDEX "work_orders_status_idx" ON "work_orders"("status");
CREATE INDEX "work_orders_type_idx" ON "work_orders"("type");
CREATE INDEX "work_orders_priority_idx" ON "work_orders"("priority");
CREATE INDEX "work_orders_assigneeUserId_idx" ON "work_orders"("assigneeUserId");
CREATE INDEX "work_orders_createdByUserId_idx" ON "work_orders"("createdByUserId");
CREATE INDEX "work_orders_requestId_idx" ON "work_orders"("requestId");
CREATE INDEX "work_orders_assetId_idx" ON "work_orders"("assetId");
CREATE INDEX "work_orders_respondBy_idx" ON "work_orders"("respondBy");
CREATE INDEX "work_orders_resolveBy_idx" ON "work_orders"("resolveBy");

CREATE INDEX "status_events_workOrderId_createdAt_idx" ON "status_events"("workOrderId", "createdAt");
CREATE INDEX "status_events_actorId_idx" ON "status_events"("actorId");

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "service_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "status_events" ADD CONSTRAINT "status_events_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
