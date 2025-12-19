/*
  Warnings:

  - You are about to drop the column `realtimeImapChecking` on the `subscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the `realtimeSelectionTime` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[pi_id]` on the table `subscription_plan_payment_status` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pi_id` to the `subscription_plan_payment_status` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "subscriptionPlan" DROP COLUMN "realtimeImapChecking",
ADD COLUMN     "invoiceAutoSyncIntervalIds" TEXT[];

-- AlterTable
ALTER TABLE "subscription_plan_payment_status" ADD COLUMN     "pi_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "realtimeSelectionTime";

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_payment_status_pi_id_key" ON "subscription_plan_payment_status"("pi_id");
