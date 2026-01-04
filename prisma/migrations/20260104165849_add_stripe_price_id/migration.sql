/*
  Warnings:

  - A unique constraint covering the columns `[stripePriceId]` on the table `PackagePricing` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `stripePriceId` to the `PackagePricing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PackagePricing" ADD COLUMN     "stripePriceId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PackagePricing_stripePriceId_key" ON "PackagePricing"("stripePriceId");
