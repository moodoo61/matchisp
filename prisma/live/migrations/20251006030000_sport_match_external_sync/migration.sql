-- AlterTable
ALTER TABLE "sport_teams" ADD COLUMN IF NOT EXISTS "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "sport_teams_externalId_key" ON "sport_teams"("externalId");

-- AlterTable
ALTER TABLE "sport_matches" ADD COLUMN IF NOT EXISTS "externalId" TEXT;
ALTER TABLE "sport_matches" ADD COLUMN IF NOT EXISTS "status" TEXT;
ALTER TABLE "sport_matches" ADD COLUMN IF NOT EXISTS "homeGoals" INTEGER;
ALTER TABLE "sport_matches" ADD COLUMN IF NOT EXISTS "awayGoals" INTEGER;
ALTER TABLE "sport_matches" ADD COLUMN IF NOT EXISTS "channelLabels" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "sport_matches" ADD COLUMN IF NOT EXISTS "goalsJson" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "sport_matches_externalId_key" ON "sport_matches"("externalId");
