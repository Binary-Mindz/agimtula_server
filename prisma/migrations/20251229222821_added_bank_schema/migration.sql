/*
  Warnings:

  - A unique constraint covering the columns `[date,description,amount,bankId]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "bankId" TEXT;

-- CreateTable
CREATE TABLE "banks" (
    "id" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "bankName" TEXT NOT NULL DEFAULT 'Tink Bank',
    "lastSync" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_date_description_amount_bankId_key" ON "transactions"("date", "description", "amount", "bankId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
