-- CreateTable
CREATE TABLE "financial_documents" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentDate" TIMESTAMP(3) NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierVatNumber" TEXT,
    "supplierCountry" TEXT,
    "items" JSONB NOT NULL,
    "subtotalExVat" DECIMAL(12,2) NOT NULL,
    "totalVat" DECIMAL(12,2) NOT NULL,
    "grandTotalInclVat" DECIMAL(12,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "category" TEXT,
    "note" TEXT,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "financial_documents_id_key" ON "financial_documents"("id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_documents_documentNumber_key" ON "financial_documents"("documentNumber");

-- CreateIndex
CREATE INDEX "financial_documents_documentType_idx" ON "financial_documents"("documentType");

-- CreateIndex
CREATE INDEX "financial_documents_documentDate_idx" ON "financial_documents"("documentDate");
