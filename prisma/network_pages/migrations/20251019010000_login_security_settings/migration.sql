-- إعدادات أمان الدخول (Hot Blocker) — singleton
CREATE TABLE IF NOT EXISTS "login_security_settings" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "tryCount" INTEGER NOT NULL DEFAULT 10,
    "blockMinutes" INTEGER NOT NULL DEFAULT 2,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_security_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "login_security_settings" ("id", "enabled", "tryCount", "blockMinutes", "updatedAt")
VALUES ('default', true, 10, 2, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
