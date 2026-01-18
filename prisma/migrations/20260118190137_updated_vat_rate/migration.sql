/*
  Warnings:

  - A unique constraint covering the columns `[country]` on the table `VatRate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `VatRate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "VatRate_country_key" ON "VatRate"("country");

-- CreateIndex
CREATE UNIQUE INDEX "VatRate_code_key" ON "VatRate"("code");
