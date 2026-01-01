/*
  Warnings:

  - You are about to drop the column `businessName` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `jobTitle` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `vatNumber` on the `profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "businessInfo" ADD COLUMN     "jobTitle" TEXT;

-- AlterTable
ALTER TABLE "profile" DROP COLUMN "businessName",
DROP COLUMN "jobTitle",
DROP COLUMN "vatNumber";
