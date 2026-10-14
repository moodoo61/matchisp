-- CreateTable
CREATE TABLE "work_order_attachments" (
    "id" UUID NOT NULL,
    "workOrderId" UUID NOT NULL,
    "uploadedById" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "workOrderId" UUID,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_order_attachments_workOrderId_createdAt_idx" ON "work_order_attachments"("workOrderId", "createdAt");
CREATE INDEX "work_order_attachments_uploadedById_idx" ON "work_order_attachments"("uploadedById");
CREATE INDEX "maintenance_notifications_userId_createdAt_idx" ON "maintenance_notifications"("userId", "createdAt");
CREATE INDEX "maintenance_notifications_userId_readAt_idx" ON "maintenance_notifications"("userId", "readAt");
CREATE INDEX "maintenance_notifications_workOrderId_idx" ON "maintenance_notifications"("workOrderId");

-- AddForeignKey
ALTER TABLE "work_order_attachments" ADD CONSTRAINT "work_order_attachments_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "maintenance_notifications" ADD CONSTRAINT "maintenance_notifications_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
