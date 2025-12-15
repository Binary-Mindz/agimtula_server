-- DropForeignKey
ALTER TABLE "email" DROP CONSTRAINT "email_userId_fkey";

-- AlterTable
ALTER TABLE "email" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "email" ADD CONSTRAINT "email_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
