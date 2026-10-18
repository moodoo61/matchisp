-- CreateTable
CREATE TABLE IF NOT EXISTS "more_page_settings" (
    "id" TEXT NOT NULL,
    "heroTitle" TEXT NOT NULL DEFAULT 'خدماتنا',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'حلول إنترنت متقدمة وخدمات شاملة',
    "itemsSectionTitle" TEXT NOT NULL DEFAULT 'خدماتنا',
    "itemsSectionSubtitle" TEXT NOT NULL DEFAULT 'نقدم مجموعة واسعة من الخدمات لتلبية احتياجاتك',
    "aboutSectionTitle" TEXT NOT NULL DEFAULT 'من نحن',
    "aboutSectionSubtitle" TEXT NOT NULL DEFAULT 'تعرف على رؤيتنا ومهمتنا وقيمنا',
    "storySectionTitle" TEXT NOT NULL DEFAULT 'قصة ماتش لينك',
    "storySectionSubtitle" TEXT NOT NULL DEFAULT 'حكاية ماتش لينك: حين يتحوّل التعب إلى اتصال',
    "footerText" TEXT NOT NULL DEFAULT 'خدمات متاحة',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "more_page_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "more_page_items" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "more_page_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "more_page_about_cards" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "iconKey" TEXT NOT NULL DEFAULT 'custom',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "more_page_about_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "more_page_story_blocks" (
    "id" UUID NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "variant" TEXT NOT NULL DEFAULT 'section',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "more_page_story_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "more_page_items_isActive_sortOrder_idx" ON "more_page_items"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "more_page_about_cards_isActive_sortOrder_idx" ON "more_page_about_cards"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "more_page_story_blocks_isActive_sortOrder_idx" ON "more_page_story_blocks"("isActive", "sortOrder");

-- Seed page flags
INSERT INTO "page_card_flags" ("key", "isEnabled", "updatedAt") VALUES
  ('more_page', true, CURRENT_TIMESTAMP),
  ('more_page_items', true, CURRENT_TIMESTAMP),
  ('more_page_about', true, CURRENT_TIMESTAMP),
  ('more_page_story', true, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- Seed default settings row
INSERT INTO "more_page_settings" ("id", "updatedAt") VALUES
  ('default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
