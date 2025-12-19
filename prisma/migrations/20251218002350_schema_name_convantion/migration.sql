/*
  Warnings:

  - You are about to drop the column `billingPeriod` on the `userSubscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the `subscription_plan_payment_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_subscription_plan` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[UserId]` on the table `userSubscriptionPlan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subscriptionPlanPaymentStatusId]` on the table `userSubscriptionPlan` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subscriptionPlanPaymentStatusId` to the `userSubscriptionPlan` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "subscription_plan_payment_status" DROP CONSTRAINT "subscription_plan_payment_status_subscriptionPlanHistoryId_fkey";

-- DropForeignKey
ALTER TABLE "user_subscription_plan" DROP CONSTRAINT "user_subscription_plan_UserId_fkey";

-- DropForeignKey
ALTER TABLE "user_subscription_plan" DROP CONSTRAINT "user_subscription_plan_subscriptionPlanPaymentStatusId_fkey";

-- AlterTable
ALTER TABLE "userSubscriptionPlan" DROP COLUMN "billingPeriod",
ADD COLUMN     "subscriptionPlanPaymentStatusId" TEXT NOT NULL;

-- DropTable
DROP TABLE "subscription_plan_payment_status";

-- DropTable
DROP TABLE "user_subscription_plan";

-- CreateTable
CREATE TABLE "userSubscriptionPlanHistory" (
    "id" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "isLimitedInvoicePerMonth" BOOLEAN NOT NULL,
    "perMonthInvoiceCount" INTEGER NOT NULL,
    "realtimeImapChecking" TEXT[],
    "price" DOUBLE PRECISION NOT NULL,
    "setupFee" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "freeTrialDays" INTEGER,
    "billingPeriod" "BillingPeriod" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "userSubscriptionPlanHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptionPlanPaymentStatus" (
    "id" TEXT NOT NULL,
    "pi_id" TEXT NOT NULL,
    "subscriptionPlanHistoryId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptionPlanPaymentStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "userSubscriptionPlanHistory_id_key" ON "userSubscriptionPlanHistory"("id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptionPlanPaymentStatus_id_key" ON "subscriptionPlanPaymentStatus"("id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptionPlanPaymentStatus_pi_id_key" ON "subscriptionPlanPaymentStatus"("pi_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptionPlanPaymentStatus_subscriptionPlanHistoryId_key" ON "subscriptionPlanPaymentStatus"("subscriptionPlanHistoryId");

-- CreateIndex
CREATE UNIQUE INDEX "userSubscriptionPlan_UserId_key" ON "userSubscriptionPlan"("UserId");

-- CreateIndex
CREATE UNIQUE INDEX "userSubscriptionPlan_subscriptionPlanPaymentStatusId_key" ON "userSubscriptionPlan"("subscriptionPlanPaymentStatusId");

-- AddForeignKey
ALTER TABLE "userSubscriptionPlan" ADD CONSTRAINT "userSubscriptionPlan_subscriptionPlanPaymentStatusId_fkey" FOREIGN KEY ("subscriptionPlanPaymentStatusId") REFERENCES "subscriptionPlanPaymentStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userSubscriptionPlanHistory" ADD CONSTRAINT "userSubscriptionPlanHistory_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptionPlanPaymentStatus" ADD CONSTRAINT "subscriptionPlanPaymentStatus_subscriptionPlanHistoryId_fkey" FOREIGN KEY ("subscriptionPlanHistoryId") REFERENCES "userSubscriptionPlanHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
