-- DropForeignKey
ALTER TABLE "PackagePricing" DROP CONSTRAINT "PackagePricing_SubscriptionPlanId_fkey";

-- AddForeignKey
ALTER TABLE "PackagePricing" ADD CONSTRAINT "PackagePricing_SubscriptionPlanId_fkey" FOREIGN KEY ("SubscriptionPlanId") REFERENCES "subscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
