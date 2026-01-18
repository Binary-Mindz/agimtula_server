-- CreateTable
CREATE TABLE "VatRate" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "standardRate" INTEGER NOT NULL DEFAULT 0,
    "reducedRate" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VatRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VatRate_id_key" ON "VatRate"("id");
