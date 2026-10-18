-- CreateTable
CREATE TABLE "work_order_comments" (
    "id" UUID NOT NULL,
    "workOrderId" UUID NOT NULL,
    "authorUserId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_order_comments_workOrderId_createdAt_idx" ON "work_order_comments"("workOrderId", "createdAt");
CREATE INDEX "work_order_comments_authorUserId_idx" ON "work_order_comments"("authorUserId");

-- AddForeignKey
ALTER TABLE "work_order_comments" ADD CONSTRAINT "work_order_comments_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
