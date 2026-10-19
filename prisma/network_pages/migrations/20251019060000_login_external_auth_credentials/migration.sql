-- نمط المصادقة: redirect = توجيه فوري | credentials = حقول ثم تحقق عبر REST
ALTER TABLE "login_external_auth_settings"
  ADD COLUMN IF NOT EXISTS "flowMode" TEXT NOT NULL DEFAULT 'credentials';

ALTER TABLE "login_external_auth_settings"
  ADD COLUMN IF NOT EXISTS "restBaseUrl" TEXT NOT NULL DEFAULT '';

ALTER TABLE "login_external_auth_settings"
  ADD COLUMN IF NOT EXISTS "restUsername" TEXT NOT NULL DEFAULT '';

ALTER TABLE "login_external_auth_settings"
  ADD COLUMN IF NOT EXISTS "restPassword" TEXT NOT NULL DEFAULT '';
