CREATE TABLE IF NOT EXISTS "login_brand_settings" (
    "id" TEXT NOT NULL,
    "useCustom" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_brand_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "login_brand_settings" ("id", "useCustom", "name", "logoUrl", "updatedAt")
VALUES ('default', false, '', '', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
