-- CreateTable
CREATE TABLE IF NOT EXISTS "_section_meta" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "_section_meta_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "_section_meta_key_key" ON "_section_meta"("key");

-- CreateTable
CREATE TABLE IF NOT EXISTS "extensions" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "context" TEXT NOT NULL DEFAULT 'from-internal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "extensions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "extensions_number_key" ON "extensions"("number");
CREATE INDEX IF NOT EXISTS "extensions_enabled_idx" ON "extensions"("enabled");

-- CDR table (Asterisk cdr_pgsql) — أسماء الأعمدة كما يتوقعها الموديول
CREATE TABLE IF NOT EXISTS "cdr" (
    "calldate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clid" TEXT NOT NULL DEFAULT '',
    "src" TEXT NOT NULL DEFAULT '',
    "dst" TEXT NOT NULL DEFAULT '',
    "dcontext" TEXT NOT NULL DEFAULT '',
    "channel" TEXT NOT NULL DEFAULT '',
    "dstchannel" TEXT NOT NULL DEFAULT '',
    "lastapp" TEXT NOT NULL DEFAULT '',
    "lastdata" TEXT NOT NULL DEFAULT '',
    "duration" INTEGER NOT NULL DEFAULT 0,
    "billsec" INTEGER NOT NULL DEFAULT 0,
    "disposition" TEXT NOT NULL DEFAULT '',
    "amaflags" INTEGER NOT NULL DEFAULT 0,
    "accountcode" TEXT NOT NULL DEFAULT '',
    "uniqueid" TEXT NOT NULL,
    "userfield" TEXT NOT NULL DEFAULT '',
    "peeraccount" TEXT NOT NULL DEFAULT '',
    "linkedid" TEXT NOT NULL DEFAULT '',
    "sequence" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "cdr_pkey" PRIMARY KEY ("uniqueid")
);

CREATE INDEX IF NOT EXISTS "cdr_src_idx" ON "cdr"("src");
CREATE INDEX IF NOT EXISTS "cdr_dst_idx" ON "cdr"("dst");
CREATE INDEX IF NOT EXISTS "cdr_calldate_idx" ON "cdr"("calldate");
