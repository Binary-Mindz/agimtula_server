-- CreateEnum
CREATE TYPE "SyncInterval" AS ENUM ('DAILY', 'HOURLY', 'EVERY_15_MINUTES');

-- AlterTable
ALTER TABLE "invoiceAutoSyncInterval" ADD COLUMN "interval" "SyncInterval" NOT NULL DEFAULT 'DAILY';
