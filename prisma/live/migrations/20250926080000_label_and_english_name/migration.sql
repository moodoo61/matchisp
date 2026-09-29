-- Rename display column and add English unique `name`

ALTER TABLE "channel_sections" RENAME COLUMN "name" TO "label";

ALTER TABLE "channel_sections" ADD COLUMN "name" TEXT;

UPDATE "channel_sections"
SET "name" = 'section_' || REPLACE("id"::text, '-', '')
WHERE "name" IS NULL;

ALTER TABLE "channel_sections" ALTER COLUMN "name" SET NOT NULL;

DROP INDEX IF EXISTS "channel_sections_name_key";

CREATE UNIQUE INDEX "channel_sections_name_key" ON "channel_sections"("name");
CREATE UNIQUE INDEX "channel_sections_label_key" ON "channel_sections"("label");

ALTER TABLE "channels" RENAME COLUMN "name" TO "label";

ALTER TABLE "channels" ADD COLUMN "name" TEXT;

UPDATE "channels"
SET "name" = 'channel_' || REPLACE("id"::text, '-', '')
WHERE "name" IS NULL;

ALTER TABLE "channels" ALTER COLUMN "name" SET NOT NULL;

CREATE UNIQUE INDEX "channels_name_key" ON "channels"("name");
CREATE UNIQUE INDEX "channels_label_key" ON "channels"("label");
