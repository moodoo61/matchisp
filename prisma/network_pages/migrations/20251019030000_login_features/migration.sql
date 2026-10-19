CREATE TABLE IF NOT EXISTS "login_features" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_features_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "login_features_isActive_sortOrder_idx"
  ON "login_features"("isActive", "sortOrder");

-- بذرة المميزات الافتراضية (الصور تُنسخ إلى uploads/login-features)
INSERT INTO "login_features" ("id", "title", "icon", "imageUrl", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), v.title, v.icon, v.image_url, v.sort_order, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
  ('العاب سلسة وبنج ping منخفض', '🛫', '/api/uploads/login-features/seed-ba1.jpg', 0),
  ('بث مباشر رياضي فائق الجودة', '⚽', '/api/uploads/login-features/seed-ba2.jpg', 1),
  ('استراحة حصرية', '📽️', '/api/uploads/login-features/seed-msdia.jpg', 2)
) AS v(title, icon, image_url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM "login_features" LIMIT 1);

INSERT INTO "page_card_flags" ("key", "isEnabled", "updatedAt")
VALUES ('login_features', true, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
