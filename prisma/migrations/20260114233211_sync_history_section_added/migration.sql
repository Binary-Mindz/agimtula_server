-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "SyncType" AS ENUM ('MANUAL', 'AUTOMATIC', 'CRON');

-- CreateTable
CREATE TABLE "imap_sync_history" (
    "id" TEXT NOT NULL,
    "imapConfigurationId" TEXT NOT NULL,
    "syncStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncCompletedAt" TIMESTAMP(3),
    "status" "SyncStatus" NOT NULL DEFAULT 'SUCCESS',
    "invoicesFound" INTEGER NOT NULL DEFAULT 0,
    "invoicesCreated" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "syncType" "SyncType" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imap_sync_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "imap_sync_history_id_key" ON "imap_sync_history"("id");

-- CreateIndex
CREATE INDEX "imap_sync_history_imapConfigurationId_idx" ON "imap_sync_history"("imapConfigurationId");

-- CreateIndex
CREATE INDEX "imap_sync_history_syncStartedAt_idx" ON "imap_sync_history"("syncStartedAt");

-- AddForeignKey
ALTER TABLE "imap_sync_history" ADD CONSTRAINT "imap_sync_history_imapConfigurationId_fkey" FOREIGN KEY ("imapConfigurationId") REFERENCES "imap_configuration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
