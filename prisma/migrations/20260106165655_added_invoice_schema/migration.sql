-- CreateEnum
CREATE TYPE "InvoiceClientType" AS ENUM ('CLIENT', 'BUSINESS');

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "type" "InvoiceClientType" NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyAddress" TEXT,
    "AddressAndContactInfo" TEXT,
    "projectInformation" TEXT,
    "projectDescription" TEXT,
    "tax" DOUBLE PRECISION NOT NULL,
    "subTotal" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "mobilePaymentLink" TEXT,
    "additionalNote" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAndItem" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "rate" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "invoiceId" TEXT,

    CONSTRAINT "ServiceAndItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_id_key" ON "Invoice"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAndItem_id_key" ON "ServiceAndItem"("id");

-- AddForeignKey
ALTER TABLE "ServiceAndItem" ADD CONSTRAINT "ServiceAndItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
