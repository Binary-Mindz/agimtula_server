-- AlterTable
ALTER TABLE "support_ticket" ADD COLUMN     "viewed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "viewedAt" TIMESTAMP(3);
