-- CreateTable
CREATE TABLE "service_request_attachments" (
    "id" UUID NOT NULL,
    "serviceRequestId" UUID NOT NULL,
    "uploadedById" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_request_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_request_attachments_serviceRequestId_createdAt_idx" ON "service_request_attachments"("serviceRequestId", "createdAt");
CREATE INDEX "service_request_attachments_uploadedById_idx" ON "service_request_attachments"("uploadedById");

-- AddForeignKey
ALTER TABLE "service_request_attachments" ADD CONSTRAINT "service_request_attachments_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
