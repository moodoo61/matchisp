-- CreateTable
CREATE TABLE IF NOT EXISTS "page_card_flags" (
    "key" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_card_flags_pkey" PRIMARY KEY ("key")
);

INSERT INTO "page_card_flags" ("key", "isEnabled", "updatedAt") VALUES
  ('login_images', true, CURRENT_TIMESTAMP),
  ('login_ticker', true, CURRENT_TIMESTAMP),
  ('login_services', true, CURRENT_TIMESTAMP),
  ('login_contacts', true, CURRENT_TIMESTAMP),
  ('login_packages', true, CURRENT_TIMESTAMP),
  ('status_services', true, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
