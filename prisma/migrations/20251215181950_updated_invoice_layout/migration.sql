-- AlterTable
ALTER TABLE "businessInfo" ALTER COLUMN "companyName" DROP NOT NULL,
ALTER COLUMN "vatNumber" DROP NOT NULL,
ALTER COLUMN "address1" DROP NOT NULL,
ALTER COLUMN "country" DROP NOT NULL;

-- AlterTable
ALTER TABLE "invoiceLayout" ADD COLUMN     "footer_text" TEXT,
ALTER COLUMN "invoice_prefix" DROP NOT NULL,
ALTER COLUMN "quote_prefix" DROP NOT NULL;

-- AlterTable
ALTER TABLE "paymentMethod" ALTER COLUMN "acc_name" DROP NOT NULL,
ALTER COLUMN "bank_name" DROP NOT NULL,
ALTER COLUMN "sort_code" DROP NOT NULL,
ALTER COLUMN "iban" DROP NOT NULL,
ALTER COLUMN "bic_swift" DROP NOT NULL;
