-- CreateTable
CREATE TABLE "regions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "regions_name_key" ON "regions"("name");
CREATE INDEX "regions_sortOrder_idx" ON "regions"("sortOrder");

-- ترحيل المناطق المستخدمة سابقاً في الوكلاء
INSERT INTO "regions" ("id", "name", "sortOrder", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  trimmed.name,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT TRIM("region") AS name
  FROM "agents"
  WHERE TRIM("region") <> ''
) AS trimmed
ON CONFLICT ("name") DO NOTHING;

-- ضمان وجود المنطقة الافتراضية
INSERT INTO "regions" ("id", "name", "sortOrder", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'أخرى', 9999, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
