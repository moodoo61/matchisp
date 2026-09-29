-- CreateTable
CREATE TABLE IF NOT EXISTS "login_contacts" (
    "id" TEXT NOT NULL,
    "adminPhone" TEXT NOT NULL DEFAULT '',
    "repairPhone" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_contacts_pkey" PRIMARY KEY ("id")
);

INSERT INTO "login_contacts" ("id", "adminPhone", "repairPhone", "updatedAt")
VALUES ('default', '', '', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
