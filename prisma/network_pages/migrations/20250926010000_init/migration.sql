-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "advertisements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_tickers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_tickers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "advertisements_isActive_sortOrder_idx" ON "advertisements"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "news_tickers_isActive_sortOrder_idx" ON "news_tickers"("isActive", "sortOrder");
