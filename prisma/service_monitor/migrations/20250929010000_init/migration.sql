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
CREATE TABLE "monitored_services" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "baseUrl" TEXT NOT NULL DEFAULT '',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitored_services_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "monitored_services_key_key" ON "monitored_services"("key");
CREATE INDEX "monitored_services_sortOrder_idx" ON "monitored_services"("sortOrder");

-- Seed الخدمات الثلاثة الأساسية
INSERT INTO "monitored_services" ("id", "key", "label", "description", "baseUrl", "isEnabled", "notes", "sortOrder", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'mistserver', 'MistServer', 'خادم البث المباشر', '', true, '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'librenms', 'LibreNMS', 'خادم المراقبة', '', true, '', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'asterisk', 'Asterisk', 'خادم الاتصالات', '', true, '', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
