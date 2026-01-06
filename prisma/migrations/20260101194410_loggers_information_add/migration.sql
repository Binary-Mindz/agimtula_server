/*
  Warnings:

  - Added the required column `message` to the `Loggers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Loggers" ADD COLUMN     "message" TEXT NOT NULL;
