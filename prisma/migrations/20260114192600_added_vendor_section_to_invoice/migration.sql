-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "vendor" TEXT;

-- AlterTable
ALTER TABLE "imap_configuration" ADD COLUMN     "lastSync" TIMESTAMP(3);
