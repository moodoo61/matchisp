-- CreateTable
CREATE TABLE "contact_methods" (
    "id" UUID NOT NULL,
    "contactType" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_methods_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contact_methods_isActive_sortOrder_idx" ON "contact_methods"("isActive", "sortOrder");

-- ترحيل الأرقام القديمة إن وُجدت
INSERT INTO "contact_methods" ("id", "contactType", "displayName", "value", "notes", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'phone', 'رقم الإدارة', "adminPhone", '', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "login_contacts"
WHERE "adminPhone" IS NOT NULL AND TRIM("adminPhone") <> '';

INSERT INTO "contact_methods" ("id", "contactType", "displayName", "value", "notes", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'phone', 'رقم الصيانة', "repairPhone", '', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "login_contacts"
WHERE "repairPhone" IS NOT NULL AND TRIM("repairPhone") <> '';
