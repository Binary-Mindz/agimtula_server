/*
  Warnings:

  - A unique constraint covering the columns `[receipt_id]` on the table `Receipt` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[milage_id]` on the table `mileage` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "receipt_id" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "mileage" ADD COLUMN     "milage_id" SERIAL NOT NULL;

-- CreateTable
CREATE TABLE "forgetPass" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forgetPass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "forgetPass_email_key" ON "forgetPass"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receipt_id_key" ON "Receipt"("receipt_id");

-- CreateIndex
CREATE UNIQUE INDEX "mileage_milage_id_key" ON "mileage"("milage_id");
