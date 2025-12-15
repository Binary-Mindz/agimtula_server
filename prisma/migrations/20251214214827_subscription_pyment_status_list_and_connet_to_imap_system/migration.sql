/*
  Warnings:

  - You are about to drop the column `isLimitedInvoicePerMonth` on the `imap_configuration` table. All the data in the column will be lost.
  - You are about to drop the column `perMonthInvoiceCount` on the `imap_configuration` table. All the data in the column will be lost.
  - You are about to drop the column `realtimeImapChecking` on the `imap_configuration` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "imap_configuration" DROP COLUMN "isLimitedInvoicePerMonth",
DROP COLUMN "perMonthInvoiceCount",
DROP COLUMN "realtimeImapChecking";

-- CreateTable
CREATE TABLE "user_subscription_plan" (
    "id" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "imapConfigurationId" TEXT NOT NULL,
    "isLimitedInvoicePerMonth" BOOLEAN NOT NULL,
    "perMonthInvoiceCount" INTEGER NOT NULL,
    "realtimeImapChecking" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "setupFee" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "freeTrialDays" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_subscription_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plan_payment_status" (
    "id" TEXT NOT NULL,
    "imapConfigurationId" TEXT,
    "subscriptionPlanHistoryId" TEXT NOT NULL,
    "userSubscriptionPlanId" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plan_payment_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_subscription_plan_id_key" ON "user_subscription_plan"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscription_plan_UserId_key" ON "user_subscription_plan"("UserId");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscription_plan_imapConfigurationId_key" ON "user_subscription_plan"("imapConfigurationId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_payment_status_id_key" ON "subscription_plan_payment_status"("id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_payment_status_imapConfigurationId_key" ON "subscription_plan_payment_status"("imapConfigurationId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_payment_status_subscriptionPlanHistoryId_key" ON "subscription_plan_payment_status"("subscriptionPlanHistoryId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_payment_status_userSubscriptionPlanId_key" ON "subscription_plan_payment_status"("userSubscriptionPlanId");

-- AddForeignKey
ALTER TABLE "user_subscription_plan" ADD CONSTRAINT "user_subscription_plan_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscription_plan" ADD CONSTRAINT "user_subscription_plan_imapConfigurationId_fkey" FOREIGN KEY ("imapConfigurationId") REFERENCES "imap_configuration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plan_payment_status" ADD CONSTRAINT "subscription_plan_payment_status_imapConfigurationId_fkey" FOREIGN KEY ("imapConfigurationId") REFERENCES "imap_configuration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plan_payment_status" ADD CONSTRAINT "subscription_plan_payment_status_subscriptionPlanHistoryId_fkey" FOREIGN KEY ("subscriptionPlanHistoryId") REFERENCES "userSubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plan_payment_status" ADD CONSTRAINT "subscription_plan_payment_status_userSubscriptionPlanId_fkey" FOREIGN KEY ("userSubscriptionPlanId") REFERENCES "user_subscription_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
