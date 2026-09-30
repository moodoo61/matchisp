-- CreateTable
CREATE TABLE "sstp_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "host" TEXT NOT NULL DEFAULT '',
    "username" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL DEFAULT '',
    "certWarn" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sstp_settings_pkey" PRIMARY KEY ("id")
);

-- إعداد أولي للاتصال المطلوب
INSERT INTO "sstp_settings" ("id", "host", "username", "password", "certWarn", "updatedAt")
VALUES ('default', '45.86.229.57', '771601616', '771601616', true, CURRENT_TIMESTAMP);
