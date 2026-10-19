-- خيارات السرعة (Hotspot domain profiles)
CREATE TABLE IF NOT EXISTS "speed_options" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "speed_options_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "speed_options_isActive_sortOrder_idx"
  ON "speed_options"("isActive", "sortOrder");

-- بذرة مطابقة للخيارات السابقة في hotspotyy (بدون كروت هوتسبوت)
INSERT INTO "speed_options" ("id", "name", "value", "isDefault", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), v.name, v.value, v.is_default, v.sort_order, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
  ('سرعة غير محدودة', 'open', false, 0),
  ('سرعة منخفضة 512k', '256k/512k', false, 1),
  ('سرعة متوسطة 1M', '512k/1M', false, 2),
  ('سرعة عالية 3M', '1M/3M', true, 3),
  ('سرعة عالية جداً 5M', '1M/5M', false, 4),
  ('سرعة مخصصة للألعاب', 'games', false, 5)
) AS v(name, value, is_default, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM "speed_options" LIMIT 1);
