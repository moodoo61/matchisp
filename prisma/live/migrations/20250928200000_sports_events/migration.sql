-- CreateEnum
CREATE TYPE "SportTeamType" AS ENUM ('CLUB', 'NATIONAL');

-- CreateTable
CREATE TABLE "sport_teams" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SportTeamType" NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sport_teams_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sport_teams_name_type_key" ON "sport_teams"("name", "type");
CREATE INDEX "sport_teams_type_name_idx" ON "sport_teams"("type", "name");

-- CreateTable
CREATE TABLE "sport_matches" (
    "id" UUID NOT NULL,
    "tournament" TEXT NOT NULL,
    "homeTeamId" UUID NOT NULL,
    "awayTeamId" UUID NOT NULL,
    "kickoffAt" TIMESTAMP(3) NOT NULL,
    "channelId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sport_matches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sport_matches_kickoffAt_idx" ON "sport_matches"("kickoffAt");
CREATE INDEX "sport_matches_channelId_idx" ON "sport_matches"("channelId");
CREATE INDEX "sport_matches_homeTeamId_idx" ON "sport_matches"("homeTeamId");
CREATE INDEX "sport_matches_awayTeamId_idx" ON "sport_matches"("awayTeamId");

-- AddForeignKey
ALTER TABLE "sport_matches" ADD CONSTRAINT "sport_matches_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "sport_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sport_matches" ADD CONSTRAINT "sport_matches_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "sport_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sport_matches" ADD CONSTRAINT "sport_matches_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
