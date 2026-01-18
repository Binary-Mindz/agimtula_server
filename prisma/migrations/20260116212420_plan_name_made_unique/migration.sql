/*
  Warnings:

  - A unique constraint covering the columns `[planName]` on the table `subscriptionPlan` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "subscriptionPlan_planName_key" ON "subscriptionPlan"("planName");
