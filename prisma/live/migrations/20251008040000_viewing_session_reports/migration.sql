-- CreateTable
CREATE TABLE "viewing_session_reports" (
    "id" UUID NOT NULL,
    "sessionId" TEXT NOT NULL,
    "streamName" TEXT NOT NULL,
    "connector" TEXT NOT NULL DEFAULT '',
    "connectionAddress" TEXT NOT NULL DEFAULT '',
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "uploadedBytes" BIGINT NOT NULL DEFAULT 0,
    "downloadedBytes" BIGINT NOT NULL DEFAULT 0,
    "tags" TEXT NOT NULL DEFAULT '',
    "endedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "viewing_session_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "viewing_session_reports_endedAt_idx" ON "viewing_session_reports"("endedAt");

-- CreateIndex
CREATE INDEX "viewing_session_reports_streamName_endedAt_idx" ON "viewing_session_reports"("streamName", "endedAt");

-- CreateIndex
CREATE INDEX "viewing_session_reports_sessionId_idx" ON "viewing_session_reports"("sessionId");
