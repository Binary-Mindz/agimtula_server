/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `NotificationSetting` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `notificationEmail` to the `NotificationSetting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `NotificationSetting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `NotificationSetting` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "NotificationSetting_id_key";

-- AlterTable
ALTER TABLE "NotificationSetting" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "invoicePaid" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "invoiceSent" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "missingReceipts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "monthlyReport" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "newBankTransactions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notificationEmail" TEXT NOT NULL,
ADD COLUMN     "notificationFrequency" TEXT NOT NULL DEFAULT 'daily',
ADD COLUMN     "paymentOverdue" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "quoteAccepted" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "quoteViewed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "unmatchedTransactions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "vatFilingReminder" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "weeklySummary" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSetting_userId_key" ON "NotificationSetting"("userId");
