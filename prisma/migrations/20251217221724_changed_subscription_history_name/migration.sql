/*
  Warnings:

  - You are about to drop the `userSubscriptionPlanHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "subscription_plan_payment_status" DROP CONSTRAINT "subscription_plan_payment_status_subscriptionPlanHistoryId_fkey";

-- DropForeignKey
ALTER TABLE "userSubscriptionPlanHistory" DROP CONSTRAINT "userSubscriptionPlanHistory_UserId_fkey";

-- DropTable
DROP TABLE "userSubscriptionPlanHistory";

-- CreateTable
CREATE TABLE "userSubscriptionPlan" (
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

    CONSTRAINT "userSubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "userSubscriptionPlan_id_key" ON "userSubscriptionPlan"("id");

-- AddForeignKey
ALTER TABLE "userSubscriptionPlan" ADD CONSTRAINT "userSubscriptionPlan_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plan_payment_status" ADD CONSTRAINT "subscription_plan_payment_status_subscriptionPlanHistoryId_fkey" FOREIGN KEY ("subscriptionPlanHistoryId") REFERENCES "userSubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
