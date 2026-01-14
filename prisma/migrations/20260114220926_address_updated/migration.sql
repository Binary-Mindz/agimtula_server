/*
  Warnings:

  - You are about to drop the column `address1` on the `businessInfo` table. All the data in the column will be lost.
  - You are about to drop the column `address2` on the `businessInfo` table. All the data in the column will be lost.
  - You are about to drop the column `address3` on the `businessInfo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "businessInfo" DROP COLUMN "address1",
DROP COLUMN "address2",
DROP COLUMN "address3",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "postalCode" TEXT;
