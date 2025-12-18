/*
  Warnings:

  - A unique constraint covering the columns `[realtimeImapCheckingId]` on the table `imap_configuration` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `paymentStatus` on the `subscriptionPlanPaymentStatus` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'PENDING', 'FAILED');

-- AlterTable
ALTER TABLE "imap_configuration" ADD COLUMN     "realtimeImapCheckingId" TEXT;

-- AlterTable
ALTER TABLE "subscriptionPlanPaymentStatus" DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "imap_configuration_realtimeImapCheckingId_key" ON "imap_configuration"("realtimeImapCheckingId");

-- AddForeignKey
ALTER TABLE "imap_configuration" ADD CONSTRAINT "imap_configuration_realtimeImapCheckingId_fkey" FOREIGN KEY ("realtimeImapCheckingId") REFERENCES "invoiceAutoSyncInterval"("id") ON DELETE SET NULL ON UPDATE CASCADE;
