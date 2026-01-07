-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "attachmentUrl" TEXT,
ADD COLUMN     "haveAttachment" BOOLEAN NOT NULL DEFAULT false;
