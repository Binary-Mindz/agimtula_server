-- DropIndex
DROP INDEX "subscriptionPlanPaymentStatus_pi_id_key";

-- AlterTable
ALTER TABLE "subscriptionPlanPaymentStatus" ALTER COLUMN "pi_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "userSubscriptionPlanHistory" ALTER COLUMN "expiredAt" DROP NOT NULL;
