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
CREATE TABLE "interface_notes" (
    "id" UUID NOT NULL,
    "ifName" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interface_notes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "interface_notes_ifName_key" ON "interface_notes"("ifName");
