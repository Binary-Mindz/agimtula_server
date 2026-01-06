/*
  Warnings:

  - You are about to drop the column `companyAddress` on the `Invoice` table. All the data in the column will be lost.
  - Added the required column `email` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Made the column `invoiceId` on table `ServiceAndItem` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ServiceAndItem" DROP CONSTRAINT "ServiceAndItem_invoiceId_fkey";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "companyAddress",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ServiceAndItem" ALTER COLUMN "invoiceId" SET NOT NULL;

-- CreateTable
CREATE TABLE "BusinessData" (
    "id" TEXT NOT NULL,
    "businessIdLabel" TEXT NOT NULL,
    "businessIdValue" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,

    CONSTRAINT "BusinessData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessData_id_key" ON "BusinessData"("id");

-- AddForeignKey
ALTER TABLE "BusinessData" ADD CONSTRAINT "BusinessData_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAndItem" ADD CONSTRAINT "ServiceAndItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
