-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "businessInfo" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "vatNumber" TEXT NOT NULL,
    "address1" TEXT NOT NULL,
    "address2" TEXT,
    "address3" TEXT,
    "country" TEXT NOT NULL,
    "website" TEXT,
    "logo" TEXT,
    "logoKey" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "businessInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paymentMethod" (
    "id" TEXT NOT NULL,
    "acc_name" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "sort_code" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "bic_swift" TEXT NOT NULL,
    "default_payment_term" TEXT,
    "late_payment_fee" INTEGER,
    "payment_instructions" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "paymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoiceLayout" (
    "id" TEXT NOT NULL,
    "invoice_prefix" TEXT NOT NULL,
    "quote_prefix" TEXT NOT NULL,
    "year_format" TEXT,
    "default_vat_rate" DOUBLE PRECISION,
    "tax_breakdown" BOOLEAN NOT NULL DEFAULT false,
    "prices_include_tax" BOOLEAN NOT NULL DEFAULT false,
    "template_title" TEXT,
    "show_company_logo" BOOLEAN NOT NULL DEFAULT false,
    "invoice_notes" TEXT,
    "terms_and_conditions" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "invoiceLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSetting" (
    "id" TEXT NOT NULL,

    CONSTRAINT "NotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptionPlan" (
    "id" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "isLimitedInvoicePerMonth" BOOLEAN NOT NULL DEFAULT false,
    "perMonthInvoiceCount" INTEGER NOT NULL DEFAULT 15,
    "realtimeImapChecking" INTEGER NOT NULL DEFAULT 15,
    "planFeatures" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagePricing" (
    "id" TEXT NOT NULL,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "setupFee" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "freeTrialDays" INTEGER,
    "billingPeriod" "BillingPeriod" NOT NULL DEFAULT 'MONTHLY',
    "SubscriptionPlanId" TEXT NOT NULL,

    CONSTRAINT "PackagePricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "businessInfo_id_key" ON "businessInfo"("id");

-- CreateIndex
CREATE UNIQUE INDEX "businessInfo_userId_key" ON "businessInfo"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "invoiceLayout_userId_key" ON "invoiceLayout"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSetting_id_key" ON "NotificationSetting"("id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptionPlan_id_key" ON "subscriptionPlan"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PackagePricing_id_key" ON "PackagePricing"("id");

-- AddForeignKey
ALTER TABLE "businessInfo" ADD CONSTRAINT "businessInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paymentMethod" ADD CONSTRAINT "paymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoiceLayout" ADD CONSTRAINT "invoiceLayout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagePricing" ADD CONSTRAINT "PackagePricing_SubscriptionPlanId_fkey" FOREIGN KEY ("SubscriptionPlanId") REFERENCES "subscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
