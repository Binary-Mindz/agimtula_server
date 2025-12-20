/*
  Warnings:

  - You are about to drop the column `invoiceAutoSyncIntervalIds` on the `subscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `isLimitedInvoicePerMonth` on the `subscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `perMonthInvoiceCount` on the `subscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `planFeatures` on the `subscriptionPlan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PackagePricing" ADD COLUMN     "invoiceAutoSyncIntervalIds" TEXT[],
ADD COLUMN     "isLimitedInvoicePerMonth" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "perMonthInvoiceCount" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "planFeatures" TEXT[];

-- AlterTable
ALTER TABLE "subscriptionPlan" DROP COLUMN "invoiceAutoSyncIntervalIds",
DROP COLUMN "isLimitedInvoicePerMonth",
DROP COLUMN "perMonthInvoiceCount",
DROP COLUMN "planFeatures";
