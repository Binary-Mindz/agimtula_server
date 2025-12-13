/*
  Warnings:

  - You are about to drop the column `monthlyPrice` on the `PackagePricing` table. All the data in the column will be lost.
  - Added the required column `price` to the `PackagePricing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PackagePricing" DROP COLUMN "monthlyPrice",
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;

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
