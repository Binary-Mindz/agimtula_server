/*
  Warnings:

  - Added the required column `vatPercentage` to the `financial_documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "financial_documents" ADD COLUMN     "vatPercentage" DECIMAL(5,2) NOT NULL;
