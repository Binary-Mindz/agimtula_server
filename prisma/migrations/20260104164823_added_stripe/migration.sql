-- AlterTable
ALTER TABLE "subscriptionPlanPaymentStatus" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSessionId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT;
