/*
  Warnings:

  - Added the required column `name` to the `mileage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "mileage" ADD COLUMN     "name" TEXT NOT NULL;
