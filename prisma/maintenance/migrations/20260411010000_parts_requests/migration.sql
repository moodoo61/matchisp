-- CreateTable
CREATE TABLE "parts_requests" (
    "id" UUID NOT NULL,
    "workOrderId" UUID NOT NULL,
    "requestedById" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'open',
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parts_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parts_requests_workOrderId_createdAt_idx" ON "parts_requests"("workOrderId", "createdAt");
CREATE INDEX "parts_requests_requestedById_idx" ON "parts_requests"("requestedById");
CREATE INDEX "parts_requests_status_idx" ON "parts_requests"("status");

-- AddForeignKey
ALTER TABLE "parts_requests" ADD CONSTRAINT "parts_requests_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
