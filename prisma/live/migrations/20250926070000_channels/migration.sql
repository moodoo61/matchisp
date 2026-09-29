-- CreateSchema
CREATE TYPE "ChannelType" AS ENUM ('IPTV', 'HDMI');

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
CREATE TABLE "channel_sections" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channels" (
    "id" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ChannelType" NOT NULL,
    "sourceUrl" TEXT,
    "videoDevice" TEXT,
    "audioDevice" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "channel_sections_name_key" ON "channel_sections"("name");

-- CreateIndex
CREATE INDEX "channel_sections_sortOrder_idx" ON "channel_sections"("sortOrder");

-- CreateIndex
CREATE INDEX "channels_sectionId_sortOrder_idx" ON "channels"("sectionId", "sortOrder");

-- CreateIndex
CREATE INDEX "channels_isActive_sortOrder_idx" ON "channels"("isActive", "sortOrder");

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "channel_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
