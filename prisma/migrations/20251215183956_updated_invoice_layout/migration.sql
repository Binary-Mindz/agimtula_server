/*
  Warnings:

  - The `default_payment_term` column on the `paymentMethod` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "paymentMethod" DROP COLUMN "default_payment_term",
ADD COLUMN     "default_payment_term" INTEGER;
