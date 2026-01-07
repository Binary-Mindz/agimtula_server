/*
  Warnings:

  - You are about to drop the column `mobilePaymentLink` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `tax` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `prices_include_tax` on the `invoiceLayout` table. All the data in the column will be lost.
  - You are about to drop the column `tax_breakdown` on the `invoiceLayout` table. All the data in the column will be lost.
  - Added the required column `vat` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "mobilePaymentLink",
DROP COLUMN "tax",
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vat" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "invoiceLayout" DROP COLUMN "prices_include_tax",
DROP COLUMN "tax_breakdown",
ADD COLUMN     "prices_include_vat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vat_breakdown" BOOLEAN NOT NULL DEFAULT false;
