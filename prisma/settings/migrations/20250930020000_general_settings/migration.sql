-- CreateTable
CREATE TABLE "general_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "systemName" TEXT NOT NULL DEFAULT 'ISP Admin',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "general_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "general_settings" ("id", "systemName", "logoUrl", "updatedAt")
VALUES ('default', 'ISP Admin', '', CURRENT_TIMESTAMP);
