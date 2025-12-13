-- CreateTable
CREATE TABLE "imap_configuration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "secure" BOOLEAN NOT NULL DEFAULT true,
    "isLimitedInvoicePerMonth" BOOLEAN NOT NULL DEFAULT false,
    "perMonthInvoiceCount" INTEGER NOT NULL DEFAULT 15,
    "realtimeImapChecking" INTEGER NOT NULL DEFAULT 86400,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imap_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userSubscriptionPlan" (
    "id" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "isLimitedInvoicePerMonth" BOOLEAN NOT NULL DEFAULT false,
    "perMonthInvoiceCount" INTEGER NOT NULL DEFAULT 15,
    "realtimeImapChecking" INTEGER NOT NULL DEFAULT 86400,
    "price" DOUBLE PRECISION NOT NULL,
    "setupFee" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "freeTrialDays" INTEGER,
    "billingPeriod" "BillingPeriod" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "userSubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "imap_configuration_id_key" ON "imap_configuration"("id");

-- CreateIndex
CREATE UNIQUE INDEX "imap_configuration_userId_key" ON "imap_configuration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "userSubscriptionPlan_id_key" ON "userSubscriptionPlan"("id");

-- AddForeignKey
ALTER TABLE "imap_configuration" ADD CONSTRAINT "imap_configuration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userSubscriptionPlan" ADD CONSTRAINT "userSubscriptionPlan_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
