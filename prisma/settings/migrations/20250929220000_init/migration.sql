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
CREATE TABLE "disk_notes" (
    "id" UUID NOT NULL,
    "devicePath" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disk_notes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "disk_notes_devicePath_key" ON "disk_notes"("devicePath");
