-- AlterTable
ALTER TABLE "userSubscriptionPlan" ALTER COLUMN "isLimitedInvoicePerMonth" DROP DEFAULT,
ALTER COLUMN "perMonthInvoiceCount" DROP DEFAULT,
ALTER COLUMN "realtimeImapChecking" DROP DEFAULT;
