/*
  Warnings:

  - You are about to drop the column `monthlyPrice` on the `PackagePricing` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PackagePricing" DROP COLUMN "monthlyPrice",
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "subscriptionPlan" ALTER COLUMN "realtimeImapChecking" SET DEFAULT 86400;

-- CreateTable
CREATE TABLE "realtimeSelectionTime" (
    "id" TEXT NOT NULL,
    "time" INTEGER NOT NULL,

    CONSTRAINT "realtimeSelectionTime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "realtimeSelectionTime_id_key" ON "realtimeSelectionTime"("id");
