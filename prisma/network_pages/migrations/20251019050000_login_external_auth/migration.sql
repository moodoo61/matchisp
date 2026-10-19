CREATE TABLE IF NOT EXISTS "login_external_auth_settings" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "remoteUrl" TEXT NOT NULL DEFAULT '',
    "httpMethod" TEXT NOT NULL DEFAULT 'post',
    "linkLabel" TEXT NOT NULL DEFAULT 'الدخول كمشترك',
    "sendMac" BOOLEAN NOT NULL DEFAULT true,
    "sendIp" BOOLEAN NOT NULL DEFAULT true,
    "sendUsername" BOOLEAN NOT NULL DEFAULT true,
    "sendLinkLogin" BOOLEAN NOT NULL DEFAULT true,
    "sendLinkOrig" BOOLEAN NOT NULL DEFAULT true,
    "sendError" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_external_auth_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "login_external_auth_settings" (
  "id", "enabled", "remoteUrl", "httpMethod", "linkLabel",
  "sendMac", "sendIp", "sendUsername", "sendLinkLogin", "sendLinkOrig", "sendError",
  "updatedAt"
)
VALUES (
  'default', false, '', 'post', 'الدخول كمشترك',
  true, true, true, true, true, true,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
