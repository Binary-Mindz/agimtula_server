-- CreateEnum
CREATE TYPE "TwoFAPurpose" AS ENUM ('LOGIN', 'ENABLE_2FA', 'DISABLE_2FA');

-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'ACCOUNTANT');

-- CreateTable
CREATE TABLE "mileage" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startLocation" TEXT NOT NULL,
    "endLocation" TEXT NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "tripType" TEXT NOT NULL,
    "vehicle" TEXT,
    "purpose" TEXT NOT NULL,
    "notes" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "mileage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imap_configuration" (
    "id" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "secure" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "connect" BOOLEAN NOT NULL DEFAULT false,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imap_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscription_plan" (
    "id" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "isLimitedInvoicePerMonth" BOOLEAN NOT NULL,
    "perMonthInvoiceCount" INTEGER NOT NULL,
    "realtimeImapChecking" TEXT[],
    "price" DOUBLE PRECISION NOT NULL,
    "setupFee" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "freeTrialDays" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_subscription_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userSubscriptionPlan" (
    "id" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "isLimitedInvoicePerMonth" BOOLEAN NOT NULL,
    "perMonthInvoiceCount" INTEGER NOT NULL,
    "realtimeImapChecking" TEXT[],
    "price" DOUBLE PRECISION NOT NULL,
    "setupFee" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "freeTrialDays" INTEGER,
    "billingPeriod" "BillingPeriod" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "userSubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plan_payment_status" (
    "id" TEXT NOT NULL,
    "subscriptionPlanHistoryId" TEXT NOT NULL,
    "userSubscriptionPlanId" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plan_payment_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "profilePicture" TEXT,
    "profilePictureKey" TEXT,
    "phone" TEXT,
    "jobTitle" TEXT,
    "businessName" TEXT,
    "vatNumber" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forgetPass" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forgetPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twoFA" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "purpose" "TwoFAPurpose" NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "twoFA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "language" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "receiptFileUrl" TEXT,
    "receiptFileKey" TEXT,
    "vendor" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ReceiptCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businessInfo" (
    "id" TEXT NOT NULL,
    "companyName" TEXT,
    "vatNumber" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "address3" TEXT,
    "country" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "logoKey" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "businessInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paymentMethod" (
    "id" TEXT NOT NULL,
    "acc_name" TEXT,
    "bank_name" TEXT,
    "sort_code" TEXT,
    "iban" TEXT,
    "bic_swift" TEXT,
    "default_payment_term" INTEGER,
    "late_payment_fee" INTEGER,
    "payment_instructions" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "paymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoiceLayout" (
    "id" TEXT NOT NULL,
    "invoice_prefix" TEXT,
    "quote_prefix" TEXT,
    "year_format" TEXT,
    "default_vat_rate" DOUBLE PRECISION,
    "tax_breakdown" BOOLEAN NOT NULL DEFAULT false,
    "prices_include_tax" BOOLEAN NOT NULL DEFAULT false,
    "template_title" TEXT,
    "footer_text" TEXT,
    "show_company_logo" BOOLEAN NOT NULL DEFAULT false,
    "invoice_notes" TEXT,
    "terms_and_conditions" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "invoiceLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invoiceSent" BOOLEAN NOT NULL DEFAULT true,
    "invoicePaid" BOOLEAN NOT NULL DEFAULT true,
    "paymentOverdue" BOOLEAN NOT NULL DEFAULT true,
    "quoteViewed" BOOLEAN NOT NULL DEFAULT true,
    "quoteAccepted" BOOLEAN NOT NULL DEFAULT true,
    "newBankTransactions" BOOLEAN NOT NULL DEFAULT false,
    "unmatchedTransactions" BOOLEAN NOT NULL DEFAULT true,
    "missingReceipts" BOOLEAN NOT NULL DEFAULT true,
    "weeklySummary" BOOLEAN NOT NULL DEFAULT true,
    "monthlyReport" BOOLEAN NOT NULL DEFAULT true,
    "vatFilingReminder" BOOLEAN NOT NULL DEFAULT true,
    "notificationEmail" TEXT NOT NULL,
    "notificationFrequency" TEXT NOT NULL DEFAULT 'daily',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "realtimeImapChecking" INTEGER NOT NULL DEFAULT 86400,
    "planFeatures" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagePricing" (
    "id" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "setupFee" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "freeTrialDays" INTEGER,
    "billingPeriod" "BillingPeriod" NOT NULL DEFAULT 'MONTHLY',
    "SubscriptionPlanId" TEXT NOT NULL,

    CONSTRAINT "PackagePricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "realtimeSelectionTime" (
    "id" TEXT NOT NULL,
    "time" INTEGER NOT NULL,

    CONSTRAINT "realtimeSelectionTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoiceAutoSyncInterval" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cronTime" TEXT NOT NULL,

    CONSTRAINT "invoiceAutoSyncInterval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "imap_configuration_id_key" ON "imap_configuration"("id");

-- CreateIndex
CREATE UNIQUE INDEX "imap_configuration_userId_key" ON "imap_configuration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscription_plan_id_key" ON "user_subscription_plan"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscription_plan_UserId_key" ON "user_subscription_plan"("UserId");

-- CreateIndex
CREATE UNIQUE INDEX "userSubscriptionPlan_id_key" ON "userSubscriptionPlan"("id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_payment_status_id_key" ON "subscription_plan_payment_status"("id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_payment_status_subscriptionPlanHistoryId_key" ON "subscription_plan_payment_status"("subscriptionPlanHistoryId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_payment_status_userSubscriptionPlanId_key" ON "subscription_plan_payment_status"("userSubscriptionPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_userId_key" ON "profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "forgetPass_email_key" ON "forgetPass"("email");

-- CreateIndex
CREATE UNIQUE INDEX "twoFA_email_purpose_key" ON "twoFA"("email", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_id_key" ON "Receipt"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptCategory_id_key" ON "ReceiptCategory"("id");

-- CreateIndex
CREATE UNIQUE INDEX "businessInfo_id_key" ON "businessInfo"("id");

-- CreateIndex
CREATE UNIQUE INDEX "businessInfo_userId_key" ON "businessInfo"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "invoiceLayout_userId_key" ON "invoiceLayout"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSetting_userId_key" ON "NotificationSetting"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptionPlan_id_key" ON "subscriptionPlan"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PackagePricing_id_key" ON "PackagePricing"("id");

-- CreateIndex
CREATE UNIQUE INDEX "realtimeSelectionTime_id_key" ON "realtimeSelectionTime"("id");

-- CreateIndex
CREATE UNIQUE INDEX "invoiceAutoSyncInterval_id_key" ON "invoiceAutoSyncInterval"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_id_key" ON "user"("id");

-- CreateIndex
CREATE UNIQUE INDEX "email_email_key" ON "email"("email");

-- CreateIndex
CREATE UNIQUE INDEX "email_userId_key" ON "email"("userId");

-- AddForeignKey
ALTER TABLE "mileage" ADD CONSTRAINT "mileage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imap_configuration" ADD CONSTRAINT "imap_configuration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscription_plan" ADD CONSTRAINT "user_subscription_plan_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userSubscriptionPlan" ADD CONSTRAINT "userSubscriptionPlan_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plan_payment_status" ADD CONSTRAINT "subscription_plan_payment_status_subscriptionPlanHistoryId_fkey" FOREIGN KEY ("subscriptionPlanHistoryId") REFERENCES "userSubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plan_payment_status" ADD CONSTRAINT "subscription_plan_payment_status_userSubscriptionPlanId_fkey" FOREIGN KEY ("userSubscriptionPlanId") REFERENCES "user_subscription_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "language" ADD CONSTRAINT "language_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ReceiptCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businessInfo" ADD CONSTRAINT "businessInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paymentMethod" ADD CONSTRAINT "paymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoiceLayout" ADD CONSTRAINT "invoiceLayout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagePricing" ADD CONSTRAINT "PackagePricing_SubscriptionPlanId_fkey" FOREIGN KEY ("SubscriptionPlanId") REFERENCES "subscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email" ADD CONSTRAINT "email_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
