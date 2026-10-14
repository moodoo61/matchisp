-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN "reviewNotes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "work_orders" ADD COLUMN "reviewedByUserId" UUID;
ALTER TABLE "work_orders" ADD COLUMN "reviewedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "work_orders_reviewedByUserId_idx" ON "work_orders"("reviewedByUserId");
