/*
  Warnings:

  - You are about to drop the column `accountName` on the `banks` table. All the data in the column will be lost.
  - You are about to drop the column `accountType` on the `banks` table. All the data in the column will be lost.
  - Added the required column `name` to the `banks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `banks` table without a default value. This is not possible if the table is not empty.
  - Made the column `accountId` on table `banks` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "banks" DROP COLUMN "accountName",
DROP COLUMN "accountType",
ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "balance" DECIMAL(10,2),
ADD COLUMN     "bankId" TEXT,
ADD COLUMN     "credentialsId" TEXT,
ADD COLUMN     "currencyCode" TEXT,
ADD COLUMN     "holderName" TEXT,
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "accountId" SET NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "accountantId" TEXT,
ADD COLUMN     "haveAccountant" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AccountantRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "description" TEXT,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountantRequest_id_key" ON "AccountantRequest"("id");
