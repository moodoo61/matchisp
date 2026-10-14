-- CreateTable
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'المخزن الرئيسي',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'قطعة',
    "minQty" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_balances" (
    "id" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_units" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "serial" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_stock',
    "holderUserId" UUID,
    "workOrderId" UUID,
    "installedAssetId" UUID,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_documents" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "warehouseId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "note" TEXT NOT NULL DEFAULT '',
    "issuedToUserId" UUID,
    "workOrderId" UUID,
    "partsRequestId" UUID,
    "createdByUserId" UUID NOT NULL,
    "postedByUserId" UUID,
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_document_lines" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "deviceUnitId" UUID,
    "serial" TEXT,
    "note" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "stock_document_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "deviceUnitId" UUID,
    "documentId" UUID,
    "type" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "actorId" UUID NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "items_code_key" ON "items"("code");

-- CreateIndex
CREATE INDEX "items_kind_idx" ON "items"("kind");

-- CreateIndex
CREATE INDEX "items_name_idx" ON "items"("name");

-- CreateIndex
CREATE INDEX "stock_balances_itemId_idx" ON "stock_balances"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_balances_warehouseId_itemId_key" ON "stock_balances"("warehouseId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "device_units_serial_key" ON "device_units"("serial");

-- CreateIndex
CREATE INDEX "device_units_itemId_idx" ON "device_units"("itemId");

-- CreateIndex
CREATE INDEX "device_units_status_idx" ON "device_units"("status");

-- CreateIndex
CREATE INDEX "device_units_holderUserId_idx" ON "device_units"("holderUserId");

-- CreateIndex
CREATE INDEX "device_units_workOrderId_idx" ON "device_units"("workOrderId");

-- CreateIndex
CREATE INDEX "device_units_installedAssetId_idx" ON "device_units"("installedAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_documents_number_key" ON "stock_documents"("number");

-- CreateIndex
CREATE INDEX "stock_documents_type_idx" ON "stock_documents"("type");

-- CreateIndex
CREATE INDEX "stock_documents_status_idx" ON "stock_documents"("status");

-- CreateIndex
CREATE INDEX "stock_documents_warehouseId_idx" ON "stock_documents"("warehouseId");

-- CreateIndex
CREATE INDEX "stock_documents_workOrderId_idx" ON "stock_documents"("workOrderId");

-- CreateIndex
CREATE INDEX "stock_documents_issuedToUserId_idx" ON "stock_documents"("issuedToUserId");

-- CreateIndex
CREATE INDEX "stock_documents_createdAt_idx" ON "stock_documents"("createdAt");

-- CreateIndex
CREATE INDEX "stock_document_lines_documentId_idx" ON "stock_document_lines"("documentId");

-- CreateIndex
CREATE INDEX "stock_document_lines_itemId_idx" ON "stock_document_lines"("itemId");

-- CreateIndex
CREATE INDEX "stock_document_lines_deviceUnitId_idx" ON "stock_document_lines"("deviceUnitId");

-- CreateIndex
CREATE INDEX "stock_movements_itemId_createdAt_idx" ON "stock_movements"("itemId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_movements_deviceUnitId_idx" ON "stock_movements"("deviceUnitId");

-- CreateIndex
CREATE INDEX "stock_movements_documentId_idx" ON "stock_movements"("documentId");

-- CreateIndex
CREATE INDEX "stock_movements_type_idx" ON "stock_movements"("type");

-- CreateIndex
CREATE INDEX "stock_movements_actorId_idx" ON "stock_movements"("actorId");

-- AddForeignKey
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_units" ADD CONSTRAINT "device_units_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_documents" ADD CONSTRAINT "stock_documents_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_document_lines" ADD CONSTRAINT "stock_document_lines_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "stock_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_document_lines" ADD CONSTRAINT "stock_document_lines_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_document_lines" ADD CONSTRAINT "stock_document_lines_deviceUnitId_fkey" FOREIGN KEY ("deviceUnitId") REFERENCES "device_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_deviceUnitId_fkey" FOREIGN KEY ("deviceUnitId") REFERENCES "device_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "stock_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
