/*
  Warnings:

  - You are about to drop the column `companyAddress` on the `Invoice` table. All the data in the column will be lost.
  - Added the required column `email` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Made the column `invoiceId` on table `ServiceAndItem` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ServiceAndItem" DROP CONSTRAINT IF EXISTS "ServiceAndItem_invoiceId_fkey";

-- Drop companyAddress column if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Invoice' 
        AND column_name = 'companyAddress'
    ) THEN
        ALTER TABLE "Invoice" DROP COLUMN "companyAddress";
    END IF;
END $$;

-- Add createdAt column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Invoice' 
        AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE "Invoice" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add email column if it doesn't exist (make it nullable first, then update and set NOT NULL if needed)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Invoice' 
        AND column_name = 'email'
    ) THEN
        -- Add as nullable first
        ALTER TABLE "Invoice" ADD COLUMN "email" TEXT;
        -- Update existing rows with a default value if any exist
        UPDATE "Invoice" SET "email" = '' WHERE "email" IS NULL;
        -- Make it NOT NULL
        ALTER TABLE "Invoice" ALTER COLUMN "email" SET NOT NULL;
    END IF;
END $$;

-- Make invoiceId NOT NULL in ServiceAndItem if it's not already
DO $$ 
BEGIN
    -- First, delete any rows with NULL invoiceId (orphaned records)
    DELETE FROM "ServiceAndItem" WHERE "invoiceId" IS NULL;
    
    -- Then set the column to NOT NULL if it's currently nullable
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ServiceAndItem' 
        AND column_name = 'invoiceId'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE "ServiceAndItem" ALTER COLUMN "invoiceId" SET NOT NULL;
    END IF;
END $$;

-- CreateTable BusinessData if it doesn't exist
CREATE TABLE IF NOT EXISTS "BusinessData" (
    "id" TEXT NOT NULL,
    "businessIdLabel" TEXT NOT NULL,
    "businessIdValue" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,

    CONSTRAINT "BusinessData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS "BusinessData_id_key" ON "BusinessData"("id");

-- AddForeignKey for BusinessData if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'BusinessData_invoiceId_fkey'
        AND table_name = 'BusinessData'
    ) THEN
        ALTER TABLE "BusinessData" ADD CONSTRAINT "BusinessData_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey for ServiceAndItem if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'ServiceAndItem_invoiceId_fkey'
        AND table_name = 'ServiceAndItem'
    ) THEN
        ALTER TABLE "ServiceAndItem" ADD CONSTRAINT "ServiceAndItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
