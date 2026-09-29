-- AlterTable
ALTER TABLE "channels"
ADD COLUMN "qualityRungIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "abrProfileKey" TEXT;
