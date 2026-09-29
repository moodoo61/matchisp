-- AlterTable
ALTER TABLE "agents"
  ADD COLUMN "region" TEXT NOT NULL DEFAULT 'أخرى',
  ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "agents_isPublic_sortOrder_idx" ON "agents"("isPublic", "sortOrder");
CREATE INDEX "agents_region_idx" ON "agents"("region");
