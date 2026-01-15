-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('CONNECTED', 'FAILED');

-- AlterTable
ALTER TABLE "imap_configuration" ADD COLUMN     "connectionStatus" "ConnectionStatus" NOT NULL DEFAULT 'CONNECTED';
