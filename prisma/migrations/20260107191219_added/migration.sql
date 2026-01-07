-- CreateEnum
CREATE TYPE "InvoiceSource" AS ENUM ('MANUAL', 'EMAIL');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "invoiceSource" "InvoiceSource" NOT NULL DEFAULT 'MANUAL';
