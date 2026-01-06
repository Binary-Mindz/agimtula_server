/*
  Warnings:

  - You are about to drop the column `message` on the `Loggers` table. All the data in the column will be lost.
  - Added the required column `information` to the `Loggers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Loggers" DROP COLUMN "message",
ADD COLUMN     "information" TEXT NOT NULL;
