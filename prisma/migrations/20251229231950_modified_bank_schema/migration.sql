/*
  Warnings:

  - You are about to drop the column `accountNumber` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `bankId` on the `transactions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[date,description,amount]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_bankId_fkey";

-- DropIndex
DROP INDEX "transactions_date_description_amount_bankId_key";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "accountNumber",
DROP COLUMN "bankId",
ADD COLUMN     "accountId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_date_description_amount_key" ON "transactions"("date", "description", "amount");
