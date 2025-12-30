/*
  Warnings:

  - A unique constraint covering the columns `[accountId]` on the table `banks` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "banks" ADD COLUMN     "accountId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "banks_accountId_key" ON "banks"("accountId");
