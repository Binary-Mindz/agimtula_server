/*
  Warnings:

  - You are about to drop the column `userSubscriptionPlanId` on the `subscription_plan_payment_status` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[subscriptionPlanPaymentStatusId]` on the table `user_subscription_plan` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subscriptionPlanPaymentStatusId` to the `user_subscription_plan` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "subscription_plan_payment_status" DROP CONSTRAINT "subscription_plan_payment_status_userSubscriptionPlanId_fkey";

-- DropIndex
DROP INDEX "subscription_plan_payment_status_userSubscriptionPlanId_key";

-- AlterTable
ALTER TABLE "subscription_plan_payment_status" DROP COLUMN "userSubscriptionPlanId";

-- AlterTable
ALTER TABLE "user_subscription_plan" ADD COLUMN     "subscriptionPlanPaymentStatusId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_subscription_plan_subscriptionPlanPaymentStatusId_key" ON "user_subscription_plan"("subscriptionPlanPaymentStatusId");

-- AddForeignKey
ALTER TABLE "user_subscription_plan" ADD CONSTRAINT "user_subscription_plan_subscriptionPlanPaymentStatusId_fkey" FOREIGN KEY ("subscriptionPlanPaymentStatusId") REFERENCES "subscription_plan_payment_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
