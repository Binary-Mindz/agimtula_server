/*
  Warnings:

  - Added the required column `planName` to the `userSubscriptionPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planName` to the `userSubscriptionPlanHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "userSubscriptionPlan" ADD COLUMN     "planName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "userSubscriptionPlanHistory" ADD COLUMN     "planName" TEXT NOT NULL;
