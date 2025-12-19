/*
  Warnings:

  - Changed the type of `userRole` on the `custom_user` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "custom_user" DROP COLUMN "userRole",
ADD COLUMN     "userRole" TEXT NOT NULL;
